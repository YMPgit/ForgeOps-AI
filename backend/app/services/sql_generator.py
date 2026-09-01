from typing import Dict, Any
from app.services.groq_service import GroqService
from app.utils.sql_validator import validate_sql


class SQLGeneratorService:
    def __init__(self):
        self.groq = GroqService()

    def _build_schema_prompt(self, schema_info: Dict[str, Any]) -> str:
        lines = ["Database Schema:"]
        for table in schema_info.get("tables", []):
            lines.append(f"\nTable: {table['name']}")
            for col in table["columns"]:
                lines.append(f"  - {col['name']} ({col['type']})")
        return "\n".join(lines)

    async def generate_sql(self, question: str, schema_info: Dict[str, Any], temperature: float = None, max_tokens: int = None, model: str = None) -> str:
        schema_prompt = self._build_schema_prompt(schema_info)

        system_prompt = f"""You are an expert SQL assistant for PostgreSQL. Generate ONLY a single SELECT statement to answer the user's question.

{schema_prompt}

Rules:
- ONLY generate SELECT statements
- Do NOT use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, REPLACE, or TRUNCATE
- Do NOT use multiple statements
- Do NOT include explanations, markdown code blocks, or any text outside the SQL
- Use proper PostgreSQL syntax
- Use table aliases if helpful for readability
- Return ONLY the raw SQL statement
"""

        prompt = f"Question: {question}\n\nGenerate the SQL query:"
        sql = await self.groq.call_llm(prompt, system_prompt=system_prompt, temperature=temperature, max_tokens=max_tokens, model=model)
        sql = validate_sql(sql)
        return sql
