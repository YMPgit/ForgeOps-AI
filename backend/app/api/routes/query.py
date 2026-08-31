from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.api.deps import get_current_data_db
from app.models.schemas import QueryRequest, QueryResponse
from app.database.connection import get_table_names, get_table_schema, get_table_row_count
from app.services.sql_generator import SQLGeneratorService
from app.services.query_executor import QueryExecutorService
from app.services.insight_generator import InsightGeneratorService
from app.services.chart_service import ChartService
from app.services.user_settings import get_user_model
from app.api.routes.history import add_history_item
import time

router = APIRouter()

sql_generator = SQLGeneratorService()
query_executor = QueryExecutorService()
insight_generator = InsightGeneratorService()
chart_service = ChartService()


@router.post("/query", response_model=QueryResponse)
async def run_query(
    request: QueryRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_current_data_db),
):
    start_time = time.time()
    user_id = current_user["id"]
    user_model = get_user_model(user_id)

    try:
        table_names = get_table_names(db)
        schema_info = {"tables": []}
        for table in table_names:
            columns = get_table_schema(db, table)
            row_count = get_table_row_count(db, table)
            schema_info["tables"].append({
                "name": table,
                "row_count": row_count,
                "columns": columns,
            })

        sql = await sql_generator.generate_sql(
            request.question, schema_info,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            model=user_model,
        )
        query_result = query_executor.execute_query(sql, db)

        chart_recommendation = chart_service.recommend_chart(
            query_result["columns"], query_result["rows"]
        )

        insights = await insight_generator.generate_insights(
            request.question, sql, query_result["columns"], query_result["rows"],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            model=user_model,
        )

        total_time = round(time.time() - start_time, 4)

        add_history_item(
            user_id=user_id,
            question=request.question,
            sql=sql,
            status="success",
            execution_time=total_time,
            session_id=request.session_id,
        )

        return QueryResponse(
            question=request.question,
            sql=sql,
            columns=query_result["columns"],
            rows=query_result["rows"],
            row_count=query_result["row_count"],
            execution_time=query_result["execution_time"],
            chart_recommendation=chart_recommendation,
            insights=insights,
            follow_up_questions=insights.get("follow_up_questions", []),
        )

    except HTTPException:
        raise
    except Exception as e:
        total_time = round(time.time() - start_time, 4)
        add_history_item(
            user_id=user_id,
            question=request.question,
            sql="",
            status="error",
            execution_time=total_time,
            session_id=request.session_id,
        )
        raise HTTPException(status_code=500, detail=str(e))