
import json
import logging
import re
import time
from resume_ai_routes import router as resume_ai_router
from resume_builder import router as resume_builder_router
from agent_ai import enhance_agent_jobs
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from resume_routes import router as resume_router

import database

from skills import extract_skills
from job_requirements import extract_requirements
from jobmatcher import match_jobs
from himalayas_jobs import get_himalayas_jobs

from agent_search import (
    AgentSearchRequest,
    recommend_agent_jobs
)


app = FastAPI(title="Searchly API")
app.include_router(resume_router)
app.include_router(resume_ai_router)
app.include_router(resume_builder_router)

database.create_database()

logger = logging.getLogger(__name__)

remotive_cache = {
    "jobs": None,
    "expires": 0
}


# Verify US location eligibility from Remotive
def is_us_eligible_location(location):
    text = str(location or "").lower().strip()
    text = text.replace(".", "")

    if not text:
        return False

    excluded = re.search(
        r"\b(?:excluding|except|outside|not available in)"
        r"\s+(?:the\s+)?(?:us|usa|united states)\b"
        r"|\bnon[- ]?us\b"
        r"|\b(?:us|usa)\s+excluded\b",
        text
    )

    if excluded:
        return False

    return bool(re.search(
        r"\b(us|usa|united states|worldwide|"
        r"anywhere|global|north america)\b",
        text
    ))


# Fetch Remotive jobs
def fetch_remotive_jobs():
    now = time.time()

    if (
        remotive_cache["jobs"] is not None
        and now < remotive_cache["expires"]
    ):
        return remotive_cache["jobs"]

    try:
        request = Request(
            "https://remotive.com/api/remote-jobs?limit=200",
            headers={
                "User-Agent": "Searchly-Capstone/1.0",
                "Accept": "application/json"
            }
        )

        with urlopen(request, timeout=15) as response:
            data = json.load(response)

        if not isinstance(data.get("jobs"), list):
            raise ValueError(
                "Invalid Remotive response"
            )

        remotive_cache["jobs"] = data["jobs"]
        remotive_cache["expires"] = (
            time.time() + 21600
        )

    except Exception as error:
        logger.warning(
            "Remotive unavailable: %s",
            error
        )

    return remotive_cache["jobs"]


# Normalize Remotive jobs
def normalize_remotive_job(job):
    job_id = job.get("id")
    url = job.get("url")

    if not job_id or not url:
        return None

    description = job.get("description") or ""

    return {
        "id": f"remotive-{job_id}",
        "title": job.get("title") or "Untitled job",
        "company": job.get("company_name") or "Unknown",
        "location": (
            job.get("candidate_required_location")
            or "Remote"
        ),
        "category": job.get("category") or "",
        "salary": job.get("salary") or "",
        "job_type": job.get("job_type") or "",
        "seniority": [],
        "published": job.get("publication_date") or "",
        "url": url,
        "source": "Remotive",
        "skills": extract_skills(description),
        **extract_requirements(description)
    }


# Real jobs from both providers
@app.get("/jobs/live")
def get_live_jobs(search: str = "", limit: int = 200):
    query = search.strip().lower()
    results = []

    remotive_jobs = fetch_remotive_jobs()

    if remotive_jobs is not None:
        for job in remotive_jobs:
            location = job.get(
                "candidate_required_location"
            )

            if not is_us_eligible_location(location):
                continue

            searchable = " ".join([
                str(job.get("title") or ""),
                str(job.get("company_name") or ""),
                str(job.get("category") or ""),
                str(location or ""),
                str(job.get("description") or "")
            ]).lower()

            if query and query not in searchable:
                continue

            normalized = normalize_remotive_job(job)

            if normalized:
                results.append(normalized)

    try:
        himalayas_jobs = get_himalayas_jobs(search)
    except Exception as error:
        logger.warning(
            "Himalayas unavailable: %s",
            error
        )
        himalayas_jobs = []

    # Merge jobs using source-specific IDs
    combined = {
        job["id"]: job
        for job in results
    }

    for job in himalayas_jobs:
        if job.get("id"):
            combined.setdefault(job["id"], job)

    all_jobs = sorted(
        combined.values(),
        key=lambda job: str(
            job.get("published") or ""
        )[:10],
        reverse=True
    )

    if remotive_jobs is None and not himalayas_jobs:
        raise HTTPException(
            status_code=502,
            detail="Job providers are temporarily unavailable"
        )

    limit = max(1, min(limit, 200))

    return all_jobs[:limit]


# Existing TF-IDF skills matching
@app.get("/recommendations/live")
def recommend_live_jobs(
    skills: str = "",
    limit: int = 20
):
    user_skills = [
        skill.strip()
        for skill in skills.split(",")
        if skill.strip()
    ]

    if not user_skills:
        raise HTTPException(
            status_code=400,
            detail="Please enter at least one skill"
        )

    jobs = get_live_jobs(search="", limit=200)

    jobs_with_skills = [
        job for job in jobs
        if job.get("skills")
    ]

    if not jobs_with_skills:
        return []

    ranked_jobs = match_jobs(
        ", ".join(user_skills),
        jobs_with_skills
    )

    user_skill_set = {
        skill.casefold()
        for skill in user_skills
    }

    for job in ranked_jobs:
        job["matched_skills"] = [
            skill for skill in job["skills"]
            if skill.casefold() in user_skill_set
        ]

        job["other_skills_mentioned"] = [
            skill for skill in job["skills"]
            if skill.casefold() not in user_skill_set
        ]

    return ranked_jobs[:max(1, min(limit, 30))]


# New Search Agent endpoint

@app.post("/api/agent/search")
def search_agent(profile: AgentSearchRequest):
    jobs = get_live_jobs(
        search="",
        limit=200
    )

    # Give AI more candidates than the final
    # number the user requested.
    wider_profile = profile.model_copy(
        update={
            "limit": min(
                20,
                max(12, profile.limit)
            )
        }
    )

    recommendations = recommend_agent_jobs(
        jobs,
        wider_profile
    )

    ai_used = False

    try:
        recommendations = enhance_agent_jobs(
            recommendations,
            profile
        )

        ai_used = bool(recommendations)

    except Exception as error:
        # Preserve the working job matcher if
        # the free AI service is unavailable.
        print(
            "AI Agent fallback:",
            type(error).__name__
        )

    return {
        "message": "Search completed",
        "jobs_considered": len(jobs),
        "results": recommendations[:profile.limit],
        "ai_used": ai_used,
        "method": (
            "AI and TF-IDF combined ranking"
            if ai_used
            else "TF-IDF fallback ranking"
        ),
    }

def search_agent(profile: AgentSearchRequest):
    jobs = get_live_jobs(
        search="",
        limit=200
    )

    recommendations = recommend_agent_jobs(
        jobs,
        profile
    )

    return {
        "message": "Search completed",
        "jobs_considered": len(jobs),
        "results": recommendations,
        "method": "TF-IDF and rule-based ranking"
    }


# Information required to save a job
class LiveJobSave(BaseModel):
    id: str
    title: str
    company: str
    location: str = ""
    url: HttpUrl
    salary: str = ""


# Save real job
@app.post("/live/saved_jobs")
def save_real_job(job: LiveJobSave):
    is_remotive = (
        job.id.startswith("remotive-")
        and job.url.scheme == "https"
        and job.url.host in (
            "remotive.com",
            "www.remotive.com"
        )
    )

    is_himalayas = (
        job.id.startswith("himalayas-")
        and job.url.scheme == "https"
    )

    if not (is_remotive or is_himalayas):
        raise HTTPException(
            status_code=400,
            detail="Unsupported job source"
        )

    database.save_live_job({
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "url": str(job.url),
        "salary": job.salary
    })

    return {
        "message": "Job saved successfully"
    }


# Get saved jobs
@app.get("/live/saved_jobs")
def get_real_saved_jobs():
    return database.get_live_saved_jobs()


# Unsave job
@app.delete("/live/saved_jobs/{job_id}")
def unsave_real_job(job_id: str):
    removed = database.remove_live_saved_job(
        job_id
    )

    if not removed:
        raise HTTPException(
            status_code=404,
            detail="Saved job not found"
        )

    return {
        "message": "Job unsaved"
    }


# Record application
@app.post("/live/applications/{job_id}")
def add_real_application(job_id: str):
    recorded = database.add_live_application(
        job_id
    )

    if not recorded:
        raise HTTPException(
            status_code=404,
            detail="Save the job before tracking it"
        )

    return {
        "message": "Application recorded"
    }


# Get application history
@app.get("/live/applications")
def get_real_applications():
    return database.get_live_applications()


# Update application status
@app.patch("/live/applications/{job_id}")
def update_real_application(job_id: str, status: str):
    allowed = {
        "Applied",
        "Interviewing",
        "Offered",
        "Rejected"
    }

    if status not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    updated = database.update_live_application_status(
        job_id,
        status
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return {
        "message": "Status updated",
        "status": status
    }


# Archive application
@app.patch("/live/applications/{job_id}/archive")
def archive_real_application(job_id: str):
    updated = database.set_live_application_archived(
        job_id,
        True
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return {
        "message": "Application archived"
    }


# Restore application
@app.patch("/live/applications/{job_id}/restore")
def restore_real_application(job_id: str):
    updated = database.set_live_application_archived(
        job_id,
        False
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return {
        "message": "Application restored"
    }
