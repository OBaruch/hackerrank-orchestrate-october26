"""Loading of the participant-facing dataset and the evidence corpus."""
from __future__ import annotations

import csv
import json
import os
from dataclasses import dataclass, field
from functools import cached_property

from . import observations as O
from . import util


def read_csv(path):
    with open(path, encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


@dataclass
class EvidenceFile:
    file_id: str
    path: str
    origin: str
    captured_at: str

    @property
    def ext(self):
        return os.path.splitext(self.path)[1].lower()


@dataclass
class Dataset:
    root: str                      # .../dataset
    media_reader: object = None    # optional callable(EvidenceFile) -> list[Observation]
    _obs: list = field(default=None, init=False, repr=False)

    # ----------------------------------------------------------------- tables
    @cached_property
    def identities(self):
        return read_csv(os.path.join(self.root, "user_identities.csv"))

    @cached_property
    def audit_log(self):
        return read_csv(os.path.join(self.root, "user_audit_log.csv"))

    @cached_property
    def activity(self):
        rows = read_csv(os.path.join(self.root, "system_activity.csv"))
        rows.sort(key=lambda r: (r["event_time"], r["activity_id"]))
        return rows

    @cached_property
    def rules(self):
        return read_csv(os.path.join(self.root, "deletion_rules.csv"))

    @cached_property
    def manifest(self) -> dict[str, EvidenceFile]:
        out = {}
        for r in read_csv(os.path.join(self.root, "evidence_files.csv")):
            out[r["file_id"]] = EvidenceFile(r["file_id"], r["file_path"], r["origin"], r["captured_at"])
        return out

    def requests(self, name="deletion_requests.csv"):
        return read_csv(os.path.join(self.root, name))

    def abspath(self, ef: EvidenceFile) -> str:
        return os.path.join(self.root, ef.path)

    def read_text(self, ef: EvidenceFile) -> str:
        with open(self.abspath(ef), encoding="utf-8") as fh:
            return fh.read()

    # ----------------------------------------------------------------- evidence
    def observations(self) -> list[O.Observation]:
        if self._obs is None:
            obs = []
            for ef in sorted(self.manifest.values(), key=lambda e: e.captured_at):
                obs.extend(self.extract(ef))
            self._obs = obs
        return self._obs

    def extract(self, ef: EvidenceFile) -> list[O.Observation]:
        ext = ef.ext
        if ext == ".log":
            return O.extract_log(ef.file_id, ef.captured_at, self.read_text(ef))
        if ext == ".sql":
            return O.extract_sql(ef.file_id, ef.captured_at, self.read_text(ef))
        if ext == ".json":
            return O.extract_json(ef.file_id, ef.captured_at, json.loads(self.read_text(ef)))
        if ext == ".txt":
            return O.extract_text_record(ef.file_id, ef.captured_at, self.read_text(ef))
        if ext in (".pdf", ".png", ".jpg", ".jpeg") and self.media_reader is not None:
            return self.media_reader(ef)
        return []

    def pdf_text(self, ef: EvidenceFile) -> str:
        from pypdf import PdfReader

        reader = PdfReader(self.abspath(ef))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
