from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_data_db
from app.database.connection import get_table_names, get_table_schema, get_table_row_count
from app.models.schemas import SchemaInfo, TableInfo, ColumnInfo

router = APIRouter()


def _build_tables(db: Session) -> list:
    table_names = get_table_names(db)
    tables = []
    for table in table_names:
        columns_raw = get_table_schema(db, table)
        row_count = get_table_row_count(db, table)
        columns = [ColumnInfo(name=col["name"], type=col["type"], nullable=not col.get("notnull", 1)) for col in columns_raw]
        tables.append(TableInfo(name=table, row_count=row_count, columns=columns))
    return tables


@router.get("/schema", response_model=SchemaInfo)
def get_schema(db: Session = Depends(get_current_data_db)):
    return SchemaInfo(tables=_build_tables(db))


@router.get("/schema/tables", response_model=SchemaInfo)
def get_tables(db: Session = Depends(get_current_data_db)):
    return SchemaInfo(tables=_build_tables(db))


@router.get("/schema/tables/{table_name}", response_model=TableInfo)
def get_table(table_name: str, db: Session = Depends(get_current_data_db)):
    table_names = get_table_names(db)
    if table_name not in table_names:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

    columns_raw = get_table_schema(db, table_name)
    row_count = get_table_row_count(db, table_name)
    columns = [ColumnInfo(name=col["name"], type=col["type"], nullable=not col.get("notnull", 1)) for col in columns_raw]
    return TableInfo(name=table_name, row_count=row_count, columns=columns)
