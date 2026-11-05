
import re

from skills import extract_skills


# Transferable and professional skills.
# Patterns should reflect actual statements in a resume.
SKILL_PATTERNS = {
    "Teaching Assistance": [
        r"\bteacher'?s?\s+aide\b",
        r"\bteaching assistant\b",
        r"\bclassroom assistant\b",
        r"\bassisted (?:the )?teacher\b"
    ],

    "Tutoring": [
        r"\btutor(?:ed|ing|s)?\b",
        r"\bpeer tutor\b",
        r"\bacademic tutoring\b"
    ],

    "Volunteering": [
        r"\bvolunteer(?:ed|ing|s)?\b",
        r"\bcommunity service\b"
    ],

    "Team Coordination": [
        r"\bmanager\b.{0,100}\bteam\b",
        r"\bteam coordinator\b",
        r"\bcoordinated (?:a |the )?team\b"
    ],

    "Leadership": [
        r"\bleadership\b",
        r"\bteam leader\b",
        r"\bled a team\b",
        r"\bsupervised (?:staff|employees|volunteers)\b"
    ],

    "Communication": [
        r"\bcommunication skills?\b",
        r"\bcommunicated with\b",
        r"\bclient communication\b",
        r"\bwritten communication\b"
    ],

    "Customer Service": [
        r"\bcustomer service\b",
        r"\bassisted customers\b",
        r"\bcustomer support\b",
        r"\bhandled customer (?:questions|complaints|inquiries)\b"
    ],

    "Cash Handling": [
        r"\bcash handling\b",
        r"\bcashier\b",
        r"\boperated (?:a |the )?(?:cash )?register\b"
    ],

    "Sales": [
        r"\bsales associate\b",
        r"\bsales representative\b",
        r"\bsales experience\b",
        r"\bsold products\b"
    ],

    "Food Preparation": [
        r"\bfood preparation\b",
        r"\bprepared (?:food|meals)\b",
        r"\bfood safety\b"
    ],

    "Inventory Management": [
        r"\binventory management\b",
        r"\binventory tracking\b",
        r"\bstock(?:ed|ing) (?:shelves|products|merchandise)\b"
    ],

    "Scheduling": [
        r"\bschedul(?:ed|ing) appointments\b",
        r"\bmanaged schedules\b",
        r"\bshift scheduling\b"
    ],

    "Data Entry": [
        r"\bdata entry\b",
        r"\bentered (?:customer|financial|student) data\b",
        r"\bmaintained (?:digital )?records\b"
    ],

    "Data Analysis": [
        r"\bdata analysis\b",
        r"\banalyzed data\b",
        r"\bdata analytics\b"
    ],

    "Research": [
        r"\bconducted research\b",
        r"\bresearch assistant\b",
        r"\bresearch project\b"
    ],

    "Project Management": [
        r"\bproject management\b",
        r"\bmanaged projects\b",
        r"\bproject coordinator\b"
    ],

    "Problem Solving": [
        r"\bproblem.solving\b",
        r"\bresolved (?:technical|customer|operational) issues\b",
        r"\btroubleshooting\b"
    ],

    "Teamwork": [
        r"\bteamwork\b",
        r"\bcollaborat(?:ed|ion|ing)\b",
        r"\bworked with (?:a |the )?team\b"
    ],

    "Mentoring": [
        r"\bmentor(?:ed|ing)?\b",
        r"\bpeer mentoring\b"
    ],

    "Public Speaking": [
        r"\bpublic speaking\b",
        r"\bdelivered presentations\b",
        r"\bpresented to (?:an )?audience\b"
    ],

    "Event Planning": [
        r"\bevent planning\b",
        r"\borganized events\b",
        r"\bplanned events\b"
    ],

    "Microsoft Office": [
        r"\bmicrosoft office\b",
        r"\bms office\b"
    ],

    "Google Workspace": [
        r"\bgoogle workspace\b",
        r"\bgoogle docs\b",
        r"\bgoogle sheets\b"
    ],

    "Special Education Support": [
        r"\b(?:teacher'?s?\s+aide|teaching assistant)\b"
        r".{0,100}\bspecial education\b"
    ]
}


def analyze_resume_skills(text):
    technical = extract_skills(text)
    transferable = []
    evidence = {}

    # Examine individual lines to avoid matching
    # phrases that are unrelated to each other.
    lines = [
        re.sub(r"\s+", " ", line).strip()
        for line in text.splitlines()
        if line.strip()
    ]

    for skill, patterns in SKILL_PATTERNS.items():
        for line in lines:
            if any(
                re.search(pattern, line, re.IGNORECASE)
                for pattern in patterns
            ):
                transferable.append(skill)
                evidence[skill] = line[:200]
                break

    combined = list(dict.fromkeys(
        technical + transferable
    ))

    return {
        "technical_skills": technical,
        "transferable_skills": transferable,
        "all_skills": combined,
        "skill_evidence": evidence
    }
