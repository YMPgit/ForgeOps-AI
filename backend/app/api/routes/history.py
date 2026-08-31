import json
from pathlib import Path
from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime
from app.core.dependencies import get_current_user
from app.models.schemas import HistoryItem

router = APIRouter()

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"

_history_store: dict = {}
_next_ids: dict = {}


def _history_file_for(user_id: int) -> Path:
    return DATA_DIR / f"history_{user_id}.json"


def _load_history(user_id: int) -> List[HistoryItem]:
    if user_id in _history_store:
        return _history_store[user_id]

    items: List[HistoryItem] = []
    path = _history_file_for(user_id)
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            for d in data:
                items.append(
                    HistoryItem(
                        id=d["id"],
                        question=d["question"],
                        sql=d.get("sql", ""),
                        timestamp=datetime.fromisoformat(d["timestamp"]),
                        status=d["status"],
                        execution_time=d.get("execution_time", 0.0),
                        session_id=d.get("session_id"),
                    )
                )
        except Exception:
            items = []

    _history_store[user_id] = items
    _next_ids[user_id] = max([item.id for item in items] or [0]) + 1
    return items


def _save_history(user_id: int):
    items = _history_store.get(user_id, [])
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        _history_file_for(user_id).write_text(
            json.dumps([item.model_dump(mode="json") for item in items], indent=2),
            encoding="utf-8",
        )
    except Exception:
        pass


def add_history_item(user_id: int, question: str, sql: str, status: str, execution_time: float, session_id: str = None):
    _load_history(user_id)
    item = HistoryItem(
        id=_next_ids.get(user_id, 1),
        question=question,
        sql=sql,
        timestamp=datetime.now(),
        status=status,
        execution_time=execution_time,
        session_id=session_id,
    )
    _history_store[user_id].append(item)
    _next_ids[user_id] = _next_ids.get(user_id, 1) + 1
    _save_history(user_id)
    return item


@router.get("/history", response_model=List[HistoryItem])
def get_history(current_user: dict = Depends(get_current_user)):
    return list(reversed(_load_history(current_user["id"])))


@router.delete("/history/{item_id}")
def delete_history_item(item_id: int, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    _history_store[user_id] = [item for item in _load_history(user_id) if item.id != item_id]
    _save_history(user_id)
    return {"message": "Item deleted"}


@router.delete("/history/session/{session_id}")
def delete_history_session(session_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    _history_store[user_id] = [item for item in _load_history(user_id) if item.session_id != session_id]
    _save_history(user_id)
    return {"message": "Conversation deleted"}


@router.delete("/history")
def clear_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    _history_store[user_id] = []
    _save_history(user_id)
    return {"message": "History cleared"}