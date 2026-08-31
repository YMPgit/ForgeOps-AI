import httpx
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()


class GroqService:
    DEFAULT_MODEL = "openai/gpt-oss-120b"

    def get_api_key(self) -> str:
        key = os.getenv("GROQ_API_KEY", "").strip()
        if not key or key == "your_groq_api_key_here":
            return ""
        return key

    def get_model(self) -> str:
        model = os.getenv("GROQ_MODEL", self.DEFAULT_MODEL).strip()
        return model if model else self.DEFAULT_MODEL

    async def test_api_key(self, api_key: Optional[str] = None) -> bool:
        key = api_key or self.get_api_key()
        if not key:
            raise ValueError("No Groq API key provided.")

        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.DEFAULT_MODEL,
            "messages": [{"role": "user", "content": "hello"}],
            "max_tokens": 5,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
            if response.status_code == 401:
                raise ValueError("Invalid Groq API key (401 Unauthorized).")
            response.raise_for_status()
            return True

    async def call_llm(self, prompt: str, system_prompt: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None, model: Optional[str] = None) -> str:
        api_key = self.get_api_key()
        if not api_key:
            raise ValueError(
                "Groq API Key is not configured. Add GROQ_API_KEY in backend/.env to enable AI features."
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model or self.get_model(),
            "messages": messages,
            "temperature": temperature if temperature is not None else 0.1,
            "max_tokens": max_tokens if max_tokens is not None else 2048,
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            try:
                response = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
                if response.status_code == 401:
                    raise ValueError(
                        "Invalid or expired Groq API key (401 Unauthorized). Update GROQ_API_KEY in backend/.env."
                    )
                if response.status_code == 404 and "model" in response.text.lower():
                    # Fallback to the default model if the configured one is not available
                    payload["model"] = self.DEFAULT_MODEL
                    response = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)

                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    raise ValueError(
                        "Invalid or expired Groq API key (401 Unauthorized). Update GROQ_API_KEY in backend/.env."
                    )
                raise ValueError(f"Groq API Error ({e.response.status_code}): {e.response.text}")
            except httpx.RequestError as e:
                raise ValueError(f"Network error communicating with Groq API: {str(e)}")

