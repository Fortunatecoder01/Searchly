
import re
from html import unescape

BLOCK_TAGS = re.compile(
    r"</?(?:p|div|li|br|h[1-6]|tr|section|ul|ol)\b[^>]*>",
    re.IGNORECASE
)

TAG = re.compile(r"<[^>]+>")


def extract_requirements(description):
    # Convert HTML descriptions into readable lines
    text = BLOCK_TAGS.sub("\n", description or "")
    text = unescape(TAG.sub(" ", text))
    text = text.replace("\xa0", " ")

    lines = [
        re.sub(r"\s+", " ", line).strip()
        for line in text.splitlines()
    ]

    lines = [line for line in lines if line]

    # Identify education mentioned in the posting
    education = "N/A"

    education_patterns = [
        (
            r"\b(?:no (?:college )?degree required|degree not required)\b",
            "No degree required"
        ),
        (
            r"\b(?:phd|ph\.d\.?|doctorate|doctoral degree)\b",
            "Doctoral degree"
        ),
        (
            r"\b(?:master'?s|masters|mba)\b",
            "Master's degree"
        ),
        (
            r"\b(?:bachelor'?s|bachelors)\b",
            "Bachelor's degree"
        ),
        (
            r"\bassociate'?s? degree\b",
            "Associate degree"
        ),
        (
            r"\b(?:high school diploma|ged)\b",
            "High school diploma/GED"
        )
    ]

    for line in lines:
        for pattern, label in education_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                if label == "No degree required":
                    education = label
                else:
                    if re.search(
                        r"\b(preferred|nice to have)\b",
                        line,
                        re.IGNORECASE
                    ):
                        qualifier = "preferred"
                    elif re.search(
                        r"\b(required|must have|minimum qualification)\b",
                        line,
                        re.IGNORECASE
                    ):
                        qualifier = "required"
                    else:
                        qualifier = "mentioned"

                    education = f"{label} ({qualifier})"

                break

        if education != "N/A":
            break

    # Extract explicitly stated years of work experience
    experiences = []

    for line in lines:
        # Avoid interpreting unrelated numbers as experience
        context = re.search(
            r"\b(experience|experienced|professional|"
            r"hands-on|working|industry|developing|building|"
            r"practicing)\b",
            line,
            re.IGNORECASE
        )

        if not context:
            continue

        # Example: 1-3 years of experience
        match_range = re.search(
            r"(?<!\d)(\d{1,2})\s*(?:-|–|—|to)\s*"
            r"(\d{1,2})\s*(?:years?|yrs?)\b",
            line,
            re.IGNORECASE
        )

        if match_range:
            low, high = map(int, match_range.groups())

            if low <= high:
                experiences.append((
                    low,
                    high,
                    f"{low}–{high} years"
                ))
                continue

        # Example: at least 5 years
        match_minimum = re.search(
            r"\b(?:at least|minimum(?: of)?|more than|over)"
            r"\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b",
            line,
            re.IGNORECASE
        )

        if match_minimum:
            years = int(match_minimum.group(1))

            experiences.append((
                years,
                None,
                f"{years}+ years"
            ))
            continue

        # Example: 4+ years of experience
        match_plus = re.search(
            r"(?<!\d)(\d{1,2})\s*\+\s*(?:years?|yrs?)\b",
            line,
            re.IGNORECASE
        )

        if match_plus:
            years = int(match_plus.group(1))

            experiences.append((
                years,
                None,
                f"{years}+ years"
            ))
            continue

        # Example: 3 years of experience
        match_fixed = re.search(
            r"(?<!\d)(\d{1,2})\s*(?:years?|yrs?)\b",
            line,
            re.IGNORECASE
        )

        if match_fixed:
            years = int(match_fixed.group(1))

            experiences.append((
                years,
                years,
                f"{years} years"
            ))

    if experiences:
        # Use the highest detected minimum to avoid
        # understating experience mentioned in the posting.
        minimum, maximum, work_experience = max(
            experiences,
            key=lambda item: item[0]
        )
    else:
        minimum = None
        maximum = None
        work_experience = "N/A"

    return {
        "education": education,
        "work_experience": work_experience,
        "experience_min_years": minimum,
        "experience_max_years": maximum
    }
