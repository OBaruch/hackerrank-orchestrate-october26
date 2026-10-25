"""Deterministic investigation core.

Given a deletion request it (1) resolves every identifier of the subject, (2) discovers
the subject's resources from evidence and activity inside the case window, (3) rebuilds
each resource's state at audit_at from the latest grounded observation, and (4) applies
deletion_rules.csv to produce findings, remediation and verification steps.
"""
from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import timedelta

from . import policy as P
from . import util
from .dataset import Dataset
from .identity import IdentityResolver, Subject
from .observations import Observation

CATALOG_RE = re.compile(r"linked (\S+) \(([^)]*)\) to (\S+?) and (user_\d+)", re.I)
CATALOG_ONLY_RE = re.compile(r"confirmed (\S+) \(([^)]*)\) belongs only to (\S+?) and (user_\d+)", re.I)
TARGET_RE = re.compile(r"\b(?:account|search|analytics|support|export|data_flow|backup|tombstone|legal_hold|marketing|object)_\d+\b")


@dataclass
class ResourceState:
    system: str
    resource_id: str
    category: str | None
    present: bool | None
    exposed: bool | None
    active: bool | None
    evidence_id: str          # file that proves the state ("" if no grounded proof)
    observed_at: str
    reasons: list = field(default_factory=list)   # how the resource was linked to the subject

    def to_dict(self):
        return dict(system=self.system, resource_id=self.resource_id, category=self.category, present=self.present,
                    exposed=self.exposed, active=self.active, evidence_id=self.evidence_id,
                    observed_at=self.observed_at, reasons=self.reasons)


@dataclass
class CaseResult:
    case_id: str
    status: str
    steps: list
    subject: Subject | None = None
    resources: list = field(default_factory=list)
    notes: list = field(default_factory=list)


class Investigator:
    def __init__(self, ds: Dataset):
        self.ds = ds
        self.idr = IdentityResolver(ds.identities, ds.audit_log)
        self.policy = P.Policy(ds.rules)
        self.obs = [o for o in ds.observations()]
        self.by_resource: dict[str, list[Observation]] = defaultdict(list)
        self.scopes: list[Observation] = []
        for o in self.obs:
            if o.kind == "scope":
                self.scopes.append(o)
            else:
                self.by_resource[o.resource_id].append(o)
        self.file_resources: dict[str, set] = defaultdict(set)
        for o in self.obs:
            if o.kind != "scope":
                self.file_resources[o.file_id].add(o.resource_id)
        self.activity_by_resource: dict[str, list[dict]] = defaultdict(list)
        for a in ds.activity:
            self.activity_by_resource[a["resource_id"]].append(a)
        self.catalog = self._catalog_links()
        self._reference_observations()
        self.attribution: dict[str, dict] = {}   # case_id -> {resource_id: reason}, filled by attribute_batches

    # ------------------------------------------------------------------ tools
    def resolve_identity(self, email: str) -> Subject:
        return self.idr.resolve(email)

    def _catalog_links(self):
        out = []
        for a in self.ds.activity:
            if a["event_type"] != "LINK_RESOURCE_IDENTITY":
                continue
            m = CATALOG_RE.search(a["details"]) or CATALOG_ONLY_RE.search(a["details"])
            if not m:
                continue
            rid, ref, email, uid = m.groups()
            out.append(dict(activity_id=a["activity_id"], time=a["event_time"], system=a["target_system"],
                            resource_id=rid, reference=ref, email=email.lower().rstrip("."), user_id=uid))
        return out

    def _reference_observations(self):
        """A catalog link names a resource by a reference (statement number, file name, user key, ...).
        Media evidence that shows a record labelled with that reference is an observation of the resource."""
        media = getattr(self.ds, "media_reader", None)
        if media is None or not hasattr(media, "find_label"):
            return
        from .media import record_state

        for c in self.catalog:
            rid = c["resource_id"]
            for token in sorted({c["reference"], rid}):
                for file_id, rec in media.find_label(token):
                    if any(o.file_id == file_id for o in self.by_resource.get(rid, [])):
                        continue
                    ef = self.ds.manifest[file_id]
                    o = record_state(file_id, ef.captured_at, rid, rec)
                    o.detail = f"media:{token}"
                    self.by_resource[rid].append(o)
                    self.file_resources[file_id].add(rid)

    @staticmethod
    def in_window(o: Observation, start: str, end: str) -> bool:
        return start <= o.captured_at <= end and o.ts <= end

    def find_resources(self, subj: Subject, start: str, end: str) -> dict[str, list[str]]:
        """resource_id -> reasons, for resources linked to the subject by grounded identifiers."""
        keys = subj.link_keys
        found: dict[str, list[str]] = defaultdict(list)
        for rid, obs in self.by_resource.items():
            for o in obs:
                if self.in_window(o, start, end) and o.links & keys:
                    hit = sorted(o.links & keys)[0]
                    found[rid].append(f"{o.file_id}:{hit}")
        for c in self.catalog:
            if start <= c["time"] <= end and (c["email"] in subj.emails or c["user_id"] == subj.user_id):
                found[c["resource_id"]].append(f"{c['activity_id']}:catalog")
        return found

    def resource_state(self, rid: str, start: str, end: str) -> ResourceState | None:
        system = util.system_for(rid)
        obs = [o for o in self.by_resource.get(rid, []) if self.in_window(o, start, end)]
        category = self._category(rid, obs)
        if not obs:
            return ResourceState(system, rid, category, None, None, None, "", "")
        latest_ts = max(o.ts for o in obs)
        top = [o for o in obs if o.ts == latest_ts]
        present = any(o.present for o in top) if any(o.present is not None for o in top) else None
        exposed = any(o.exposed for o in top if o.exposed is not None) if any(o.exposed is not None for o in top) else None
        active = any(o.active for o in top if o.active is not None) if any(o.active is not None for o in top) else None
        cite = max(top, key=lambda o: (o.captured_at, o.file_id)).file_id
        return ResourceState(system, rid, category, present, exposed, active, cite, latest_ts)

    def absence_proof(self, rid: str, start: str, end: str, prefer_files: set) -> str:
        """Latest complete snapshot of the resource's system that does not list it."""
        system = util.system_for(rid)
        cands = [s for s in self.scopes if s.scope_system == system and start <= s.captured_at <= end
                 and rid not in self.file_resources.get(s.file_id, set())]
        if not cands:
            return ""
        preferred = [s for s in cands if s.file_id in prefer_files]
        if preferred:
            return max(preferred, key=lambda s: s.ts).file_id
        nonempty = [s for s in cands if any(util.system_for(r) == system for r in self.file_resources.get(s.file_id, ()))]
        pool = nonempty or cands
        return max(pool, key=lambda s: s.ts).file_id

    def _category(self, rid, obs):
        system = util.system_for(rid)
        cats = [o.category for o in obs if o.category]
        if not cats:
            cats = [o.category for o in self.by_resource.get(rid, []) if o.category]
        for special in ("SUPPORT_ATTACHMENT", "SECONDARY_IDENTIFIER", "MARKETING_PROFILE", "PRODUCT_TELEMETRY",
                        "CACHE_ENTRY", "EMAIL_DELIVERY_LOG", "LEGAL_HOLD_RECORD"):
            if special in cats:
                return special
        return cats[-1] if cats else util.SYSTEM_CATEGORY.get(system)

    def deletion_activity(self, start: str, end: str) -> list[dict]:
        return [a for a in self.ds.activity if a["source_system"] == "deletion_worker" and start <= a["event_time"] <= end]

    # ------------------------------------------------------------------ batch attribution
    # Worker-event templates and the offset window (minutes from reported_at) in which they occur.
    EVENT_WINDOWS = [
        ("submitted primary profile", -95, -25, -60),
        ("Policy action completed", -40, 0, -20),
        ("received the final result", 10, 160, 70),
        ("Connector status check", 10, 160, 70),
        ("Restore-access check", 10, 160, 70),
        ("reported the requested operation", -15, 25, 1),
        ("stopped after", -15, 25, 1),
        ("completed some internal work", -15, 25, 1),
    ]

    def _identified(self) -> set:
        ids = set()
        for rid, obs in self.by_resource.items():
            for o in obs:
                if any("@" in k or k.startswith("user_") or util.HASH_RE.fullmatch(k) for k in o.links):
                    ids.add(rid)
                    break
        ids |= {c["resource_id"] for c in self.catalog}
        return ids

    FAILING_TEMPLATES = ("received the final result", "Connector status check", "Restore-access check")
    STATUS_RESULT = {"COMPLETE": "SUCCESS", "PARTIALLY_COMPLETE": "PARTIAL", "NOT_STARTED": "FAILED"}

    def identity_owner_links(self, subj: Subject, rid: str) -> bool:
        """True when any participant-visible observation (at any time) ties rid to the subject."""
        keys = subj.link_keys
        return any(o.links & keys for o in self.by_resource.get(rid, []))

    def attribute_batches(self, requests: list[dict]):
        """Attribute deletion-worker targets that carry no identifier in the case window (404 accounts,
        anonymized analytics, ...) to the deletion requests processed in the same batch.

        Requests sharing a reported_at form a batch. Each worker event is placed in the batch whose
        reported_at fits the event template's timing. Inside a batch a target can only go to a request
        that (a) still lacks a resource of that system, (b) shows the target in the evidence files that
        hold its other resources, (c) for primary profiles, whose reported_status matches the worker
        result (COMPLETE/SUCCESS, PARTIALLY_COMPLETE/PARTIAL, NOT_STARTED/FAILED), and (d) for
        "policy action completed" targets, whose own worker run did not report failures. Unique matches
        are taken first, 2-way ties are paired in a stable order, wider ties are left unassigned.
        """
        reqs = [r for r in requests if r.get("_deletion", True)]
        info = {}
        for r in reqs:
            subj = self.idr.resolve(r["email"])
            found = self.find_resources(subj, r["requested_at"], r["audit_at"])
            files = set()
            failing = False
            for rid in found:
                for o in self.by_resource.get(rid, []):
                    if self.in_window(o, r["requested_at"], r["audit_at"]):
                        files.add(o.file_id)
                for a in self.activity_by_resource.get(rid, []):
                    if a["source_system"] == "deletion_worker" and any(t in a["details"] for t in self.FAILING_TEMPLATES):
                        failing = True
            info[r["case_id"]] = dict(req=r, subj=subj, systems={util.system_for(x) for x in found}, files=files,
                                      failing=failing, found=set(found))
        identified = self._identified()
        batches = defaultdict(list)
        for r in reqs:
            batches[r["reported_at"]].append(r)
        reps = sorted(batches)
        rep_dt = {rep: util.parse_ts(rep) for rep in reps}
        placed: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
        for a in self.ds.activity:
            rid = a["resource_id"]
            if a["source_system"] != "deletion_worker" or not TARGET_RE.fullmatch(rid):
                continue
            tmpl = next((w for w in self.EVENT_WINDOWS if w[0] in a["details"]), None)
            if tmpl is None:
                continue
            t = util.parse_ts(a["event_time"])
            best = None
            for rep in reps:
                d = (t - rep_dt[rep]).total_seconds() / 60
                if tmpl[1] <= d <= tmpl[2]:
                    score = abs(d - tmpl[3])
                    if best is None or score < best[0]:
                        best = (score, rep)
            if best:
                lst = placed[best[1]][util.system_for(rid)]
                if all(x[0]["resource_id"] != rid for x in lst):
                    lst.append((a, tmpl[0]))
        out: dict[str, dict] = defaultdict(dict)
        for rep, by_system in placed.items():
            group = batches[rep]
            for system, items in by_system.items():
                targets = []
                for a, tmpl in items:
                    rid = a["resource_id"]
                    owners = [r["case_id"] for r in group if rid not in identified or self.identity_owner_links(info[r["case_id"]]["subj"], rid)]
                    if rid in identified:
                        # identifier evidence (possibly captured after a case's audit time) names the owner
                        for c in owners:
                            if system not in info[c]["systems"] and (system == "account_service" or system in self.RETAINED_SYSTEMS):
                                out[c][rid] = "batch-identified"
                        continue
                    targets.append((a, tmpl))
                need = [r for r in group if system not in info[r["case_id"]]["systems"] and not any(
                    util.system_for(x) == system for x in out.get(r["case_id"], {}))]
                if system == "account_service":
                    self._assign_accounts(out, group, items, targets, need, info)
                else:
                    self._match(out, system, targets, need, info)
        self.attribution = out
        return out

    RETAINED_SYSTEMS = ("security_service", "legal_service")

    def _assign_accounts(self, out, group, items, targets, need, info):
        """Every deletion request has one primary profile. Choose the assignment of the batch's
        unidentified profile submissions to the requests still lacking one that (1) respects the worker
        result / reported status pairing and evidence visibility, and (2) keeps the worker's processing
        order a rotation of the requests' submission order, anchored on the profiles whose owner is
        known from identifiers. When several assignments remain, a stable one is chosen (tagged a guess)."""
        if not targets or not need:
            return
        from itertools import permutations

        order = sorted(group, key=lambda r: (r["requested_at"], r["case_id"]))
        rank = {r["case_id"]: i for i, r in enumerate(order)}
        seq = [a["resource_id"] for a, _ in sorted(items, key=lambda x: (x[0]["event_time"], x[0]["activity_id"]))]
        known = {}
        for r in group:
            c = r["case_id"]
            for rid in sorted(info[c]["found"]) + list(out.get(c, {})):
                if rid in seq:
                    known[rid] = c
        free = [a for a, _ in sorted(targets, key=lambda x: x[0]["event_time"])]
        cases = [r for r in need if r["case_id"] not in known.values()]
        if not free or not cases:
            return
        tmpl = {a["resource_id"]: t for a, t in targets}
        ok = {(a["resource_id"], r["case_id"]): self._compatible(a, tmpl[a["resource_id"]], r, info) is not False
              for a in free for r in cases}
        k = min(len(free), len(cases))
        best = []
        for chosen in permutations([a["resource_id"] for a in free], k):
            pairs = list(zip(chosen, [r["case_id"] for r in cases[:k]])) if len(cases) >= k else None
            # enumerate which cases receive the chosen accounts
            for case_pick in permutations([r["case_id"] for r in cases], k):
                pairs = list(zip(chosen, case_pick))
                if not all(ok[p] for p in pairs):
                    continue
                owner = dict(known)
                owner.update(pairs)
                ring = [rank[owner[rid]] for rid in seq if rid in owner]
                n = len(order)
                cyclic = all((ring[i + 1] - ring[i]) % n == 1 for i in range(len(ring) - 1)) if n > 1 else True
                best.append((not cyclic, pairs))
            if len(best) > 2000:
                break
        if not best:
            return
        best.sort(key=lambda x: (x[0], [(int(c.rsplit("_", 1)[1]), int(a.rsplit("_", 1)[1])) for a, c in x[1]]))
        top = [set(b[1]) for b in best if b[0] == best[0][0]]
        for rid, c in best[0][1]:
            certain = all((rid, c) in t for t in top)
            out[c][rid] = ("batch-ring" if not best[0][0] else "batch") if certain else "batch-guess"

    def _compatible(self, a, tmpl, r, info) -> bool | None:
        """None = target never appears in evidence (only allowed for primary profiles)."""
        rid = a["resource_id"]
        ci = info[r["case_id"]]
        if tmpl == "submitted primary profile":
            want = self.STATUS_RESULT.get(r["reported_status"])
            if want and a["reported_result"] != want:
                return False
        if tmpl == "Policy action completed" and ci["failing"]:
            return False
        obs = self.by_resource.get(rid, [])
        if not obs:
            return None
        if not ci["files"]:
            return "weak"   # nothing else of the request is visible: a fallback owner for leftover targets
        return any(o.file_id in ci["files"] for o in obs)

    def _match(self, out, system, targets, need, info):
        if not targets or not need:
            return
        compat, invisible, weak = {}, {}, {}
        for a, tmpl in targets:
            rid = a["resource_id"]
            res = {r["case_id"]: self._compatible(a, tmpl, r, info) for r in need}
            compat[rid] = [c for c, v in res.items() if v is True]
            weak[rid] = [c for c, v in res.items() if v == "weak"]
            invisible[rid] = [c for c, v in res.items() if v is None]
            # a target shown in evidence is the grounded proof of a finished treatment; requests whose
            # worker run reported failures get their proof-less targets instead (and vice versa)
            calm = [c for c in compat[rid] if not info[c]["failing"]]
            if calm:
                compat[rid] = calm
            hot = [c for c in invisible[rid] if info[c]["failing"]]
            if hot:
                invisible[rid] = hot
        assigned_c, assigned_r = set(), set()

        def solve(cmap, tag, max_tie):
            changed = True
            while changed:
                changed = False
                for rid, cs in cmap.items():
                    live = [c for c in cs if c not in assigned_c]
                    if rid not in assigned_r and len(live) == 1:
                        out[live[0]][rid] = tag
                        assigned_c.add(live[0]); assigned_r.add(rid); changed = True
                for c in sorted({c for cs in cmap.values() for c in cs} - assigned_c, key=lambda x: int(x.rsplit("_", 1)[1])):
                    live = [rid for rid, cs in cmap.items() if rid not in assigned_r and c in cs]
                    if len(live) == 1:
                        out[c][live[0]] = tag
                        assigned_c.add(c); assigned_r.add(live[0]); changed = True
            rest_r = sorted([rid for rid in cmap if rid not in assigned_r and any(c not in assigned_c for c in cmap[rid])],
                            key=lambda x: int(x.rsplit("_", 1)[1]))
            rest_c = sorted({c for rid in rest_r for c in cmap[rid]} - assigned_c, key=lambda c: int(c.rsplit("_", 1)[1]))
            if rest_r and len(rest_r) <= max_tie and len(rest_c) == len(rest_r):
                for rid, c in zip(rest_r, rest_c):
                    out[c][rid] = tag + "-tie"
                    assigned_c.add(c); assigned_r.add(rid)

        solve(compat, "batch", 2)
        solve(weak, "batch-weak", 1)
        if system == "account_service":
            solve(invisible, "batch-invisible", 2)

    # ------------------------------------------------------------------ case audit
    def audit(self, req: dict, is_deletion: bool = True) -> CaseResult:
        cid = req["case_id"]
        if not is_deletion:
            return CaseResult(cid, "NOT_APPLICABLE", [], notes=["request does not authorize deletion"])
        subj = self.resolve_identity(req["email"])
        start, end = req["requested_at"], req["audit_at"]
        found = self.find_resources(subj, start, end)
        for rid, why in self.attribution.get(cid, {}).items():
            found.setdefault(rid, []).append(why)
        states = []
        for rid, reasons in sorted(found.items()):
            st = self.resource_state(rid, start, end)
            if st is None or st.system is None:
                continue
            st.reasons = reasons + st.reasons
            states.append(st)
        later = self.later_retained(subj, start, end, set(found))
        return self.plan(cid, subj, states, start, end, later)

    def later_retained(self, subj: Subject, start: str, end: str, known: set) -> list[str]:
        """Retained records (security / legal) whose link to the subject is only documented by evidence
        captured after audit_at. They are never cited and never decide the case state; they only extend
        the post-remediation checks of an incomplete case (the record must still be there afterwards)."""
        keys = subj.link_keys
        out = set()
        for rid, obs in self.by_resource.items():
            if rid in known or util.system_for(rid) not in self.RETAINED_SYSTEMS:
                continue
            if any(o.captured_at > end and start <= o.ts <= end and o.links & keys for o in obs):
                out.add(rid)
        return sorted(out)

    def plan(self, cid, subj, states, start, end, later=()) -> CaseResult:
        findings, remediation, verification = [], [], []
        case_files = {s.evidence_id for s in states if s.evidence_id}
        for st in states:
            action = self.policy.action(st.category or "")
            present = st.present
            if present is None and st.system == "account_service":
                present = False
            f, r, v = P.plan_for(action, present, st.exposed, st.active)
            if f:
                findings.append(dict(system_id=st.system, resource_id=st.resource_id, operation=f, evidence_id=st.evidence_id))
            if r:
                remediation.append(dict(system_id=st.system, resource_id=st.resource_id, operation=r, evidence_id=""))
            ev = st.evidence_id
            if v == "VERIFY_RECORD_ABSENT" and (st.present is None or not ev):
                ev = self.absence_proof(st.resource_id, start, end, case_files) or ev
            verification.append(dict(system_id=st.system, resource_id=st.resource_id, operation=v, evidence_id=ev))
        if findings:
            for v in verification:
                v["evidence_id"] = ""
            for rid in later:
                verification.append(dict(system_id=util.system_for(rid), resource_id=rid,
                                         operation="VERIFY_RECORD_PRESENT", evidence_id=""))
            steps = P.order_steps(findings + remediation + verification)
            status = "INCOMPLETE"
        else:
            verification = [v for v in verification if v["evidence_id"]]
            steps = P.order_steps(verification)
            status = "COMPLETE"
        return CaseResult(cid, status, steps, subject=subj, resources=states)
