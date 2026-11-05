
import os

from openai import OpenAI
from pydantic import BaseModel


MODEL_NAME = "openai/gpt-oss-120b"


def run_ai(
    instructions: str,
    content: str,
    output_schema: type[BaseModel]
):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is missing."
        )

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        timeout=60.0,
        max_retries=1
    )

    response = client.responses.parse(
        model=MODEL_NAME,
        instructions=instructions,
        input=content[:16000],
        text_format=output_schema
    )

    if response.output_parsed is None:
        raise RuntimeError(
            "The AI did not return a valid response."
        )

    return response.output_parsed
