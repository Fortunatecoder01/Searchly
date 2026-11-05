
import hashlib
import json
import logging
import time

from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from skills import extract_skills
from job_requirements import extract_requirements


logger = logging.getLogger(__name__)

CACHE = {}
CACHE_SECONDS = 21600


# Convert timestamps to seconds.
# Handles both seconds and milliseconds.
def normalize_timestamp(value):
    try:
        timestamp = float(value)

        if timestamp > 100_000_000_000:
            timestamp = timestamp / 1000

        return timestamp

    except (TypeError, ValueError, OverflowError):
        return None


# Format salary information
def format_salary(job):
    low = job.get("minSalary")
    high = job.get("maxSalary")

    if low is None and high is None:
        return ""

    currency = job.get("currency") or "USD"
    period = job.get("salaryPeriod") or "annual"

    try:
        if low is not None and high is not None:
            amount = (
                f"{float(low):,.0f} - "
                f"{float(high):,.0f}"
            )
        else:
            value = low if low is not None else high
            amount = f"{float(value):,.0f}"

        return f"{currency} {amount} / {period}"

    except (TypeError, ValueError):
        return ""


# Convert Himalayas jobs to Searchly's format
def normalize_job(job):
    guid = job.get("guid")
    apply_url = job.get("applicationLink")

    if not isinstance(guid, str) or not guid:
        return None

    if not isinstance(apply_url, str):
        return None

    if not apply_url.startswith("https://"):
        return None

    # Check expiry using normalized timestamps
    expiry = normalize_timestamp(
        job.get("expiryDate")
    )

    if expiry is not None and expiry > 0:
        if expiry < time.time():
            return None

    # Read job description
    description = job.get("description") or ""

    # Location restrictions
    restrictions = (
        job.get("locationRestrictions") or []
    )

    if restrictions:
        names = []

        for item in restrictions:
            if isinstance(item, dict):
                name = (
                    item.get("name")
                    or item.get("alpha2")
                    or item.get("country")
                )
            else:
                name = str(item)

            if name:
                names.append(str(name))

        location = ", ".join(names) or "Worldwide"
    else:
        location = "Worldwide"

    # Job category
    categories = job.get("categories") or []

    if categories:
        category = str(categories[0])
    else:
        category = "Other"

    # Published date
    published = ""
    posted = normalize_timestamp(
        job.get("pubDate")
    )

    if posted is not None:
        try:
            published = datetime.fromtimestamp(
                posted,
                tz=timezone.utc
            ).isoformat()

        except (OverflowError, OSError, ValueError):
            published = ""

    # Generate a unique ID
    unique_id = hashlib.sha256(
        guid.encode("utf-8")
    ).hexdigest()[:20]

    # Extract technical skills
    skills = extract_skills(description)

    # Extract education and experience requirements
    requirements = extract_requirements(
        description
    )

    return {
        "id": f"himalayas-{unique_id}",
        "title": job.get("title") or "Untitled role",
        "company": (
            job.get("companyName")
            or "Unknown company"
        ),
        "location": location,
        "category": category,
        "salary": format_salary(job),
        "job_type": job.get("employmentType") or "",
        "seniority": job.get("seniority") or [],
        "published": published,
        "url": apply_url,
        "source": "Himalayas",
        "skills": skills,
        **requirements
    }


# Retrieve US-eligible jobs from Himalayas
def get_himalayas_jobs(search=""):
    keyword = search.strip()[:100]
    cache_key = keyword.lower()

    cached = CACHE.get(cache_key)

    # Use cached results when available
    if cached and time.time() < cached["expires"]:
        return cached["jobs"]

    results = []
    seen = set()

    try:
        # Pages 1 through 9
        for page in range(1, 10):
            params = {
                "page": page,
                "sort": "recent",
                "country": "US"
            }

            if keyword:
                params["q"] = keyword

            url = (
                "https://himalayas.app/jobs/api/search?"
                + urlencode(params)
            )

            request = Request(
                url,
                headers={
                    "User-Agent": "Searchly-Capstone/1.0",
                    "Accept": "application/json"
                }
            )

            with urlopen(
                request,
                timeout=10
            ) as response:
                data = json.load(response)

            batch = data.get("jobs", [])

            if not isinstance(batch, list):
                raise ValueError(
                    "Invalid Himalayas response"
                )

            if not batch:
                break

            for raw_job in batch:
                normalized = normalize_job(raw_job)

                if normalized is None:
                    continue

                job_id = normalized["id"]

                if job_id in seen:
                    continue

                seen.add(job_id)
                results.append(normalized)

            # Stop when the final page is reached
            if len(batch) < 20:
                break

    except Exception as error:
        logger.warning(
            "Himalayas provider error: %s",
            error
        )

        if not results:
            return cached["jobs"] if cached else []

    # Cache the successful results
    CACHE[cache_key] = {
        "jobs": results,
        "expires": time.time() + CACHE_SECONDS
    }

    logger.info(
        "Himalayas returned %s jobs",
        len(results)
    )

    return results
