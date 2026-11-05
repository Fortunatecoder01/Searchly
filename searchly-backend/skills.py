
import re
from html import unescape

SKILL_PATTERNS = {
    "Python": r"\bpython\b",
    "SQL": r"\bsql\b",
    "Java": r"\bjava\b",
    "JavaScript": r"\bjavascript\b",
    "TypeScript": r"\btypescript\b",
    "React": r"\breact(?:\.js)?\b",
    "Node.js": r"\bnode(?:\.js|js)?\b",
    "HTML": r"\bhtml\b",
    "CSS": r"\bcss\b",
    "Git": r"\bgit\b",
    "Docker": r"\bdocker\b",
    "Kubernetes": r"\bkubernetes\b",
    "AWS": r"\baws\b",
    "Azure": r"\bazure\b",
    "Linux": r"\blinux\b",
    "FastAPI": r"\bfastapi\b",
    "Django": r"\bdjango\b",
    "Flask": r"\bflask\b",
    "PostgreSQL": r"\bpostgres(?:ql)?\b",
    "MongoDB": r"\bmongodb\b",
    "TensorFlow": r"\btensorflow\b",
    "PyTorch": r"\bpytorch\b",
    "Pandas": r"\bpandas\b",
    "Excel": r"\bexcel\b",
    "Tableau": r"\btableau\b",
    "Power BI": r"\bpower\s*bi\b",
    "Machine Learning": r"\bmachine learning\b",
    "REST APIs": r"\brest(?:ful)?\s+apis?\b"
}


def extract_skills(description):
    # Remove HTML tags from the job description
    clean_text = re.sub(
        r"<[^>]+>",
        " ",
        description or ""
    )

    clean_text = unescape(clean_text)

    found_skills = []

    for skill, pattern in SKILL_PATTERNS.items():
        if re.search(pattern, clean_text, re.IGNORECASE):
            found_skills.append(skill)

    return found_skills
