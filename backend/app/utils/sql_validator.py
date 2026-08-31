import re
from fastapi import HTTPException


def sanitize_sql(sql: str) -> str:
    sql = sql.strip()
    # Extract code fence content if present
    match = re.search(r"```(?:sql)?\s*([\s\S]*?)\s*```", sql, flags=re.IGNORECASE)
    if match:
        sql = match.group(1).strip()
    else:
        # If there's explanatory text before SELECT, slice from SELECT
        select_match = re.search(r"\bSELECT\b[\s\S]*", sql, flags=re.IGNORECASE)
        if select_match:
            sql = select_match.group(0).strip()

    sql = re.sub(r"```\s*", "", sql).strip()
    sql = sql.rstrip(";")
    return sql


def validate_sql(sql: str):
    sql = sanitize_sql(sql)

    statements = [s.strip() for s in sql.split(";") if s.strip()]
    if len(statements) > 1:
        raise HTTPException(status_code=400, detail="Multiple SQL statements are not allowed")

    if not sql.strip():
        raise HTTPException(status_code=400, detail="SQL query is empty")

    first_word = sql.strip().split()[0].upper()
    if first_word != "SELECT":
        raise HTTPException(status_code=400, detail="Only SELECT statements are allowed")

    destructive_keywords = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
        "REPLACE", "ATTACH", "DETACH", "PRAGMA", "VACUUM"
    ]

    sql_upper = sql.upper()
    for keyword in destructive_keywords:
        pattern = r'\b' + keyword + r'\b'
        if re.search(pattern, sql_upper):
            raise HTTPException(status_code=400, detail=f"SQL keyword '{keyword}' is not allowed")

    return sql
