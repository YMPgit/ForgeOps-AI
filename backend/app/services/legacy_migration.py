import json
import shutil
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"
UPLOAD_ROOT = BACKEND_DIR / "uploads"

LEGACY_HISTORY = DATA_DIR / "history.json"
LEGACY_ACTIVE = UPLOAD_ROOT / "active_source.json"


def _first_user_id():
    from sqlalchemy import text
    from app.database.connection import engine

    with engine.connect() as conn:
        row = conn.execute(text("SELECT id FROM users ORDER BY id LIMIT 1")).fetchone()
        return row[0] if row else None


def _migrate_history(user_id: int):
    target = DATA_DIR / f"history_{user_id}.json"
    if not LEGACY_HISTORY.exists() or target.exists():
        return
    try:
        shutil.copy(LEGACY_HISTORY, target)
    except Exception:
        pass


def _migrate_uploads(user_id: int):
    if not LEGACY_ACTIVE.exists():
        return
    user_dir = UPLOAD_ROOT / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    target_active = user_dir / "active_source.json"
    if target_active.exists():
        return

    for item in UPLOAD_ROOT.glob("*.db"):
        try:
            shutil.move(str(item), str(user_dir / item.name))
        except Exception:
            pass

    active_data = None
    try:
        active_data = json.loads(LEGACY_ACTIVE.read_text(encoding="utf-8"))
    except Exception:
        active_data = None

    try:
        shutil.move(str(LEGACY_ACTIVE), str(target_active))
    except Exception:
        pass

    if active_data:
        old_path = Path(active_data.get("path", ""))
        if old_path.parent == UPLOAD_ROOT:
            active_data["path"] = (user_dir / old_path.name).as_posix()
            try:
                target_active.write_text(json.dumps(active_data), encoding="utf-8")
            except Exception:
                pass


def run_legacy_migration():
    """Move pre-multi-user global data into the original (first) account.

    Before multi-user support, history was stored in data/history.json and
    the active datasource in uploads/active_source.json. This was the original
    account's data, so it is handed to the user with the lowest id.
    """
    user_id = _first_user_id()
    if user_id is None:
        return
    _migrate_history(user_id)
    _migrate_uploads(user_id)