from typing import List, Dict, Any, Optional
from app.models.schemas import ChartRecommendation

MEASURE_KEYWORDS = [
    "count", "sum", "total", "amount", "revenue", "sales", "qty", "quantity",
    "profit", "margin", "price", "avg", "average", "value", "growth", "rate",
    "score", "population", "units",
]


def _is_id_column(name: str) -> bool:
    lower = name.lower()
    return lower == "id" or lower.endswith("_id") or lower.endswith(".id") or lower in ("key", "idx")


def _is_measure_column(name: str) -> bool:
    return any(kw in name.lower() for kw in MEASURE_KEYWORDS)


class ChartService:
    def recommend_chart(self, columns: List[str], rows: List[Dict[str, Any]]) -> Optional[ChartRecommendation]:
        if not rows or not columns:
            return None

        date_columns = [c for c in columns if any(word in c.lower() for word in ["date", "time", "year", "month", "created_at", "order_date"])]

        numeric_columns = [
            c for c in columns
            if not _is_id_column(c)
            and any(row.get(c) and isinstance(row[c], (int, float)) for row in rows[:5])
        ]
        numeric_columns.sort(key=lambda c: 0 if _is_measure_column(c) else 1)

        str_columns = [
            c for c in columns
            if not _is_id_column(c)
            and c not in date_columns
            and c not in numeric_columns
            and any(row.get(c) and isinstance(row[c], str) for row in rows[:5])
        ]

        if date_columns and numeric_columns:
            return ChartRecommendation(
                type="line",
                x_axis=date_columns[0],
                y_axis=numeric_columns[0],
            )

        if str_columns and numeric_columns:
            unique_count = len(set(row.get(str_columns[0]) for row in rows))
            if unique_count <= 8 and len(rows) <= 20:
                return ChartRecommendation(
                    type="pie",
                    x_axis=str_columns[0],
                    y_axis=numeric_columns[0],
                )
            else:
                return ChartRecommendation(
                    type="bar",
                    x_axis=str_columns[0],
                    y_axis=numeric_columns[0],
                )

        if len(numeric_columns) >= 2:
            return ChartRecommendation(
                type="bar",
                x_axis=columns[0],
                y_axis=numeric_columns[0],
            )

        return None
