"""Small shared helpers: time parsing, identifier normalization, resource naming."""
from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
USER_RE = re.compile(r"\buser_\d+\b")
HASH_RE = re.compile(r"\b[0-9a-f]{64}\b")
RESOURCE_RE = re.compile(
    r"\b(?:account|search|analytics|support|export|data_flow|backup|audit_record|tombstone|"
    r"marketing|email_delivery|object|cache|legal_hold|telemetry)_\d+\b"
)

# resource-id prefix -> owning system (system ids used in the answer key)
PREFIX_SYSTEM = [
    ("audit_record_", "security_service"),
    ("data_flow_", "integration_service"),
    ("email_delivery_", "email_delivery_service"),
    ("legal_hold_", "legal_service"),
    ("tombstone_", "identity_service"),
    ("analytics_", "analytics_platform"),
    ("account_", "account_service"),
    ("search_", "search_service"),
    ("support_", "support_platform"),
    ("export_", "export_service"),
    ("backup_", "backup_service"),
    ("marketing_", "marketing_platform"),
    ("object_", "object_storage"),
    ("cache_", "cache_service"),
    ("telemetry_", "analytics_platform"),
]

# default data category of a resource, by system
SYSTEM_CATEGORY = {
    "account_service": "USER_PROFILE",
    "search_service": "SEARCH_INDEX_ENTRY",
    "analytics_platform": "ANALYTICS_PROFILE",
    "support_platform": "SUPPORT_MESSAGE",
    "export_service": "USER_EXPORT",
    "integration_service": "DATA_FLOW",
    "backup_service": "BACKUP_ARCHIVE",
    "security_service": "SECURITY_AUDIT_LOG",
    "identity_service": "ACCOUNT_TOMBSTONE",
    "marketing_platform": "MARKETING_PROFILE",
    "email_delivery_service": "EMAIL_DELIVERY_LOG",
    "legal_service": "LEGAL_HOLD_RECORD",
    "cache_service": "CACHE_ENTRY",
    "object_storage": "SUPPORT_ATTACHMENT",
}


def system_for(resource_id: str) -> str | None:
    for prefix, system in PREFIX_SYSTEM:
        if resource_id.startswith(prefix):
            return system
    return None


def parse_ts(value: str) -> datetime:
    value = value.strip()
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def norm_id(value) -> str | None:
    """Normalize an identifier for matching (emails are case-insensitive)."""
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in ("null", "none", "[redacted]"):
        return None
    if "@" in text:
        return text.lower()
    return text


def norm_phone(value: str) -> str:
    return re.sub(r"[^\d+]", "", value or "")


def is_null(value) -> bool:
    return value is None or (isinstance(value, str) and value.strip().lower() in ("", "null", "none"))


def truthy(value) -> bool | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in ("true", "1", "yes", "y", "enabled", "allowed", "active"):
        return True
    if text in ("false", "0", "no", "n", "disabled", "blocked", "stopped"):
        return False
    return None
