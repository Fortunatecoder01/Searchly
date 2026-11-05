
from pydantic import BaseModel

from ai_service import run_ai


class ModelTest(BaseModel):
    working: bool
    message: str


result = run_ai(
    instructions=(
        "You are Searchly's AI assistant. "
        "Set working to true and briefly explain "
        "how you help people find jobs."
    ),
    content="Introduce yourself as Searchly AI.",
    output_schema=ModelTest
)

print("AI Model Working:", result.working)
print("AI Response:", result.message)
