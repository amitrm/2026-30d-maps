"""Data ledger and the standard ``plate.json`` export read by the website."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1


@dataclass(frozen=True)
class Ledger:
    """Provenance printed on every plate: where the data came from and how it was handled."""

    source: str
    dataset_id: str
    url: str
    pulled: date
    units: str
    method: list[str] = field(default_factory=list)
    caveats: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d['pulled'] = self.pulled.isoformat()
        return d


def _default(obj: Any) -> Any:
    """JSON encoder for numpy scalars and dates."""
    if hasattr(obj, 'item'):
        return obj.item()
    if isinstance(obj, date):
        return obj.isoformat()
    raise TypeError(f'Not JSON serializable: {type(obj).__name__}')


def write_plate(path: Path, *, day: int, ledger: Ledger, finding: str,
                payload: dict[str, Any]) -> Path:
    """Write ``output/plate.json``: metadata the site expects plus the day-specific payload."""
    doc = {
        'schema': SCHEMA_VERSION,
        'day': day,
        'generated': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'asOf': ledger.pulled.isoformat(),
        'finding': finding,
        'ledger': ledger.to_dict(),
        **payload,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=1, default=_default, ensure_ascii=False) + '\n')
    return path
