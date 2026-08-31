import time
import os
import re
from typing import Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.utils.sql_validator import validate_sql


class QueryExecutorService:
    def __init__(self, max_rows: int = None):
        self.max_rows = max_rows or int(os.getenv("MAX_QUERY_ROWS", "1000"))

    def execute_query(self, sql: str, db: Session) -> Dict[str, Any]:
        validated_sql = validate_sql(sql).rstrip(";")
        if not re.search(r'\bLIMIT\b', validated_sql, re.IGNORECASE):
            validated_sql = f"{validated_sql} LIMIT {self.max_rows}"

        start_time = time.time()
        try:
            result = db.execute(text(validated_sql))
            columns = list(result.keys())
            rows = [dict(row._mapping) for row in result.fetchall()]
            execution_time = round(time.time() - start_time, 4)

            for row in rows:
                for key, value in row.items():
                    if hasattr(value, "isoformat"):
                        row[key] = value.isoformat()

            return {
                "columns": columns,
                "rows": rows,
                "row_count": len(rows),
                "execution_time": execution_time,
            }
        except Exception as e:
            raise RuntimeError(f"SQL execution error: {str(e)}")
