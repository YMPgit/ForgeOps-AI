from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime
from sqlalchemy import text
from app.core.dependencies import get_current_user
from app.models.schemas import HistoryItem
from app.database.connection import SessionLocal

router = APIRouter()


def add_history_item(user_id: int, question: str, sql: str, status: str, execution_time: float, session_id: str = None):
    db = SessionLocal()
    try:
        db.execute(
            text(
                "INSERT INTO user_history (user_id, question, sql, status, execution_time, session_id, timestamp) "
                "VALUES (:user_id, :question, :sql, :status, :execution_time, :session_id, :timestamp)"
            ),
            {
                "user_id": user_id,
                "question": question,
                "sql": sql,
                "status": status,
                "execution_time": execution_time,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
            },
        )
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _load_history(user_id: int) -> List[HistoryItem]:
    db = SessionLocal()
    try:
        result = db.execute(
            text(
                "SELECT id, question, sql, timestamp, status, execution_time, session_id "
                "FROM user_history WHERE user_id = :user_id ORDER BY timestamp DESC"
            ),
            {"user_id": user_id},
        )
        items = []
        for row in result.fetchall():
            ts = row[3]
            items.append(
                HistoryItem(
                    id=row[0],
                    question=row[1],
                    sql=row[2] or "",
                    timestamp=ts,
                    status=row[4],
                    execution_time=row[5] or 0.0,
                    session_id=row[6],
                )
            )
        return items
    finally:
        db.close()


@router.get("/history", response_model=List[HistoryItem])
def get_history(current_user: dict = Depends(get_current_user)):
    return _load_history(current_user["id"])


@router.delete("/history/{item_id}")
def delete_history_item(item_id: int, current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        db.execute(
            text("DELETE FROM user_history WHERE user_id = :user_id AND id = :item_id"),
            {"user_id": current_user["id"], "item_id": item_id},
        )
        db.commit()
    finally:
        db.close()
    return {"message": "Item deleted"}


@router.delete("/history/session/{session_id}")
def delete_history_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        db.execute(
            text("DELETE FROM user_history WHERE user_id = :user_id AND session_id = :session_id"),
            {"user_id": current_user["id"], "session_id": session_id},
        )
        db.commit()
    finally:
        db.close()
    return {"message": "Conversation deleted"}


@router.delete("/history")
def clear_history(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        db.execute(
            text("DELETE FROM user_history WHERE user_id = :user_id"),
            {"user_id": current_user["id"]},
        )
        db.commit()
    finally:
        db.close()
    return {"message": "History cleared"}
