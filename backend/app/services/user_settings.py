import json
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"


def _settings_file(user_id: int) -> Path:
    return DATA_DIR / f"settings_{user_id}.json"


def get_user_model(user_id: int):
    path = _settings_file(user_id)
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return data.get("model") or None
        except Exception:
            return None
    return None


def set_user_model(user_id: int, model: str):
    path = _settings_file(user_id)
    existing = {}
    if path.exists():
        try:
            existing = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            existing = {}
    existing["model"] = model
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(existing, indent=2), encoding="utf-8")