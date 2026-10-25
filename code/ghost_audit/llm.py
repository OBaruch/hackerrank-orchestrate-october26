"""Thin Claude client: structured-JSON calls, an on-disk response cache and token/cost accounting.

Credentials are read from the environment only (ORCHESTRATE_ANTHROPIC_API_KEY, then ANTHROPIC_API_KEY).
Every response is cached under code/cache/llm/<sha256>.json together with the usage of the original
call, so re-runs are deterministic and free, and the usage report can still show what the answers cost.
"""
from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import dataclass, field

DEFAULT_MODEL = "claude-haiku-5-5"
API_BASE = "https://api.anthropic.com"

# USD per million tokens (input, output), Anthropic first-party list prices
PRICES = {
    "claude-haiku-5-5": (0.10, 0.50),
    "claude-haiku-4-5": (1.00, 5.00),
    "claude-sonnet-5-5": (2.00, 10.00),
    "claude-opus-5-5": (4.00, 20.00),
}

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache", "llm")


def api_key() -> str | None:
    return os.environ.get("ORCHESTRATE_ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_API_KEY") or None


@dataclass
class ModelUsage:
    live_calls: int = 0
    cached_calls: int = 0
    input_tokens: int = 0          # tokens of all answers used in this run (live + replayed from cache)
    output_tokens: int = 0
    live_input_tokens: int = 0     # tokens actually billed during this run
    live_output_tokens: int = 0
    by_purpose: dict = field(default_factory=dict)

    def cost(self, model, live_only=False):
        pin, pout = PRICES.get(model, (0.0, 0.0))
        i, o = (self.live_input_tokens, self.live_output_tokens) if live_only else (self.input_tokens, self.output_tokens)
        return i / 1e6 * pin + o / 1e6 * pout


class UsageTracker:
    def __init__(self):
        self.models: dict[str, ModelUsage] = {}
        self.failures = 0

    def record(self, model, purpose, usage: dict, cached: bool):
        m = self.models.setdefault(model, ModelUsage())
        i, o = int(usage.get("input_tokens", 0)), int(usage.get("output_tokens", 0))
        m.input_tokens += i
        m.output_tokens += o
        if cached:
            m.cached_calls += 1
        else:
            m.live_calls += 1
            m.live_input_tokens += i
            m.live_output_tokens += o
        p = m.by_purpose.setdefault(purpose, {"calls": 0, "input_tokens": 0, "output_tokens": 0})
        p["calls"] += 1
        p["input_tokens"] += i
        p["output_tokens"] += o

    def summary(self) -> dict:
        out = {"models": {}, "failures": self.failures}
        tot = dict(calls=0, live_calls=0, cached_calls=0, input_tokens=0, output_tokens=0, cost_usd=0.0,
                   live_cost_usd=0.0)
        for model, m in sorted(self.models.items()):
            row = dict(live_calls=m.live_calls, cached_calls=m.cached_calls, calls=m.live_calls + m.cached_calls,
                       input_tokens=m.input_tokens, output_tokens=m.output_tokens,
                       live_input_tokens=m.live_input_tokens, live_output_tokens=m.live_output_tokens,
                       cost_usd=round(m.cost(model), 6), live_cost_usd=round(m.cost(model, True), 6),
                       price_per_mtok=PRICES.get(model), by_purpose=m.by_purpose)
            out["models"][model] = row
            for k in ("calls", "live_calls", "cached_calls", "input_tokens", "output_tokens"):
                tot[k] += row[k]
            tot["cost_usd"] += row["cost_usd"]
            tot["live_cost_usd"] += row["live_cost_usd"]
        tot["cost_usd"] = round(tot["cost_usd"], 6)
        tot["live_cost_usd"] = round(tot["live_cost_usd"], 6)
        out["total"] = tot
        return out


def _stable(obj) -> str:
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


class LLM:
    """Structured-output calls to a small Claude model, with cache-first behaviour.

    mode: "auto" (live calls when a key is present, cache otherwise), "cache" (never call the API),
    "live" (require a key).
    """

    def __init__(self, model: str | None = None, mode: str = "auto", cache_dir: str = CACHE_DIR,
                 tracker: UsageTracker | None = None):
        self.model = model or os.environ.get("GHOST_AUDIT_MODEL", DEFAULT_MODEL)
        self.cache_dir = cache_dir
        self.tracker = tracker or UsageTracker()
        key = api_key()
        if mode == "live" and not key:
            raise RuntimeError("LLM mode 'live' needs ORCHESTRATE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY")
        self.client = None
        if key and mode in ("auto", "live"):
            import anthropic

            self.client = anthropic.Anthropic(api_key=key, base_url=os.environ.get("GHOST_AUDIT_API_BASE", API_BASE),
                                              max_retries=4)

    @property
    def live(self) -> bool:
        return self.client is not None

    def _key(self, system, content, schema, max_tokens):
        fingerprint = []
        for block in content:
            if block.get("type") in ("image", "document"):
                data = block["source"].get("data", "")
                fingerprint.append({"type": block["type"], "sha256": hashlib.sha256(data.encode()).hexdigest()})
            else:
                fingerprint.append(block)
        return hashlib.sha256(_stable([self.model, system, fingerprint, schema, max_tokens]).encode()).hexdigest()

    def json_call(self, purpose: str, system: str, content: list, schema: dict, max_tokens: int = 2048) -> dict | None:
        """Return the JSON object the model produced for `content`, or None when unavailable."""
        key = self._key(system, content, schema, max_tokens)
        path = os.path.join(self.cache_dir, key[:2], key + ".json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as fh:
                entry = json.load(fh)
            self.tracker.record(entry["model"], purpose, entry["usage"], cached=True)
            return entry["output"]
        if not self.live:
            return None
        resp = None
        for attempt in range(3):
            try:
                resp = self.client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    system=system,
                    thinking={"type": "disabled"},
                    output_config={"effort": "low", "format": {"type": "json_schema", "schema": schema}},
                    messages=[{"role": "user", "content": content}],
                )
                break
            except Exception as exc:  # network / overload: back off, then give up to the deterministic path
                if attempt == 2:
                    self.tracker.failures += 1
                    print(f"[llm] {purpose}: call failed ({type(exc).__name__}); falling back")
                    return None
                time.sleep(2 ** (attempt + 1))
        usage = {"input_tokens": resp.usage.input_tokens, "output_tokens": resp.usage.output_tokens}
        self.tracker.record(self.model, purpose, usage, cached=False)
        if resp.stop_reason not in ("end_turn", "stop_sequence"):
            self.tracker.failures += 1
            return None
        text = next((b.text for b in resp.content if b.type == "text"), "")
        try:
            output = json.loads(text)
        except json.JSONDecodeError:
            self.tracker.failures += 1
            return None
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump({"model": self.model, "purpose": purpose, "usage": usage, "output": output}, fh,
                      ensure_ascii=False, indent=1, sort_keys=True)
        return output
