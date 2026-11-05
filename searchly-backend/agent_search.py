
import re
from typing import Literal

from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class AgentSearchRequest(BaseModel):
    role: str = Field(min_length=2, max_length=120)
    major: str = Field(default="", max_length=120)
    skills: str = Field(default="", max_length=500)

    education: Literal[
        "not_specified",
        "high_school",
        "associate",
        "bachelor",
        "master",
        "doctorate"
    ] = "not_specified"

    years_experience: int = Field(
        default=0,
        ge=0,
        le=40
    )

    experience_level: Literal[
        "student",
        "early",
        "all"
    ] = "student"

    limit: int = Field(default=10, ge=1, le=20)


def classify_level(job):
    raw_seniority = job.get("seniority") or ""

    if isinstance(raw_seniority, list):
        seniority = " ".join(map(str, raw_seniority))
    else:
        seniority = str(raw_seniority)

    text = (
        f"{job.get('title') or ''} {seniority}"
    ).lower()

    years = job.get("experience_min_years")

    experienced = (
        r"\b(senior|sr|staff|principal|lead|"
        r"architect|director|manager|executive|"
        r"vp|head of|subject matter expert)\b"
    )

    if re.search(experienced, text):
        return "experienced"

    if (
        isinstance(years, (int, float))
        and not isinstance(years, bool)
        and years >= 4
    ):
        return "experienced"

    early = (
        r"\b(intern|internship|junior|"
        r"entry[ -]?level|new[ -]?grad|graduate|"
        r"apprentice|trainee|associate)\b"
    )

    if re.search(early, text):
        return "early"

    if (
        isinstance(years, (int, float))
        and not isinstance(years, bool)
        and years <= 2
    ):
        return "possible"

    return "unknown"


def recommend_agent_jobs(jobs, profile: AgentSearchRequest):
    user_skills = [
        item.strip()
        for item in profile.skills.split(",")
        if item.strip()
    ]

    skill_keys = {
        skill.casefold()
        for skill in user_skills
    }

    role_words = set(
        re.findall(
            r"[a-z0-9]+",
            profile.role.casefold()
        )
    ) - {"and", "or", "the", "job", "role"}

    candidates = []

    for job in jobs:
        level = classify_level(job)

        if (
            profile.experience_level == "student"
            and level not in {"early", "possible"}
        ):
            continue

        if (
            profile.experience_level == "early"
            and level != "early"
        ):
            continue

        candidates.append((job, level))

    if not candidates:
        return []

    # Compare the user's career profile with
    # the real job titles, categories and skills.
    query = " ".join(
        [profile.role] * 3
        + [profile.major]
        + user_skills * 2
    )

    documents = []

    for job, level in candidates:
        document = " ".join([
            str(job.get("title") or ""),
            str(job.get("title") or ""),
            str(job.get("category") or ""),
            " ".join(
                map(str, job.get("skills") or [])
            ),
            str(job.get("job_type") or "")
        ])

        documents.append(document)

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2)
    )

    matrix = vectorizer.fit_transform([
        query,
        *documents
    ])

    similarities = cosine_similarity(
        matrix[0:1],
        matrix[1:]
    ).ravel()

    results = []

    for (job, level), similarity in zip(
        candidates,
        similarities
    ):
        mentioned_skills = [
            str(skill)
            for skill in job.get("skills") or []
        ]

        matched_skills = [
            skill
            for skill in mentioned_skills
            if skill.casefold() in skill_keys
        ]

        other_skills = [
            skill
            for skill in mentioned_skills
            if skill.casefold() not in skill_keys
        ]

        title_words = set(
            re.findall(
                r"[a-z0-9]+",
                str(job.get("title") or "").casefold()
            )
        )

        role_overlap = (
            len(title_words & role_words)
            / max(1, len(role_words))
        )

        skill_overlap = (
            len(matched_skills) / max(1, len(skill_keys))
            if user_skills else 0
        )

        score = min(
            1.0,
            0.65 * float(similarity)
            + 0.20 * role_overlap
            + 0.15 * skill_overlap
        )

        if score < 0.04:
            continue

        reasons = []

        if role_overlap:
            reasons.append(
                "The job title overlaps with your target role."
            )

        if matched_skills:
            reasons.append(
                "Skills mentioned that you entered: "
                + ", ".join(matched_skills[:5])
                + "."
            )

        if level == "early":
            reasons.append(
                "The posting is labeled as an internship "
                "or entry-level opportunity."
            )

        elif level == "possible":
            reasons.append(
                "The extracted experience requirement "
                "may fit early-career applicants."
            )

        if not reasons:
            reasons.append(
                "The job text is similar to your search profile."
            )

        cautions = []

        required_years = job.get(
            "experience_min_years"
        )

        if (
            isinstance(required_years, (int, float))
            and required_years > profile.years_experience
        ):
            experience_label = (
                job.get("work_experience")
                or f"{required_years} years"
            )

            cautions.append(
                f"Posting mentions {experience_label}; "
                f"you entered {profile.years_experience} years."
            )

        if job.get("education") in (None, "", "N/A"):
            cautions.append(
                "Education requirements were not "
                "identified in the posting."
            )

        if other_skills:
            cautions.append(
                "Other skills mentioned, not necessarily "
                "required: "
                + ", ".join(other_skills[:6])
                + "."
            )

        results.append({
            **job,
            "match_score": round(score, 4),
            "experience_group": level,
            "matched_skills": matched_skills,
            "other_skills_mentioned": other_skills,
            "reasons": reasons,
            "cautions": cautions
        })

    results.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return results[:profile.limit]