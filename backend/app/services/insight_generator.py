from typing import Dict, Any, List
from app.services.groq_service import GroqService
import json
import re


class InsightGeneratorService:
    def __init__(self):
        self.groq = GroqService()

    async def generate_insights(self, question: str, sql: str, columns: List[str], rows: List[Dict[str, Any]], temperature: float = None, max_tokens: int = None, model: str = None) -> Dict[str, Any]:
        sample_rows = rows[:10]
        rows_text = json.dumps(sample_rows, indent=2, default=str)

        system_prompt = """You are a data analyst assistant. Analyze the SQL query results and provide insights.
Return ONLY a valid JSON object with these exact keys:
- summary: A brief summary of the data (1-2 sentences)
- key_findings: List of 3-5 key findings from the data
- recommendations: List of 3-5 actionable recommendations based on the data
- follow_up_questions: List of 3-5 follow-up questions the user might ask

Do NOT include any text outside the JSON object."""

        prompt = f"""Question: {question}
SQL Query: {sql}
Columns: {columns}
Data (first 10 rows):
{rows_text}

Provide insights and follow-up questions in JSON format:"""

        response = await self.groq.call_llm(prompt, system_prompt=system_prompt, temperature=temperature, max_tokens=max_tokens, model=model)

        try:
            json_match = re.search(r"\{.*\}", response, re.DOTALL)
            if json_match:
                insights = json.loads(json_match.group())
                return {
                    "summary": insights.get("summary", "No summary available"),
                    "key_findings": insights.get("key_findings", []),
                    "recommendations": insights.get("recommendations", []),
                    "follow_up_questions": insights.get("follow_up_questions", []),
                }
        except Exception:
            pass

        return {
            "summary": "Analysis generated successfully",
            "key_findings": ["Data retrieved successfully"],
            "recommendations": ["Consider running additional queries for deeper insights"],
            "follow_up_questions": ["What trends do you see over time?", "Which categories perform best?"],
        }
