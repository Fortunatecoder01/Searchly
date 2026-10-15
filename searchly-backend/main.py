from fastapi import FastAPI, HTTPException
from jobmatcher import match_jobs
import database

app = FastAPI()
database.create_database()
jobs = [
    {
        "id": 1,
        "title": "Software Engineering Intern",
        "company": "ABC Corp",
        "location": "Remote",
        "skills": ["Python", "SQL", "Git"]
    },
    {
        "id": 2,
        "title": "Data Analyst Intern",
        "company": "XYZ Corp",
        "location": "Washington, DC",
        "skills": ["Python", "SQL", "Excel"]
    },
    {
        "id": 3,
        "title": "Web Developer Intern",
        "company": "Tech Company",
        "location": "Remote",
        "skills": ["JavaScript", "React", "HTML", "CSS"]
    },
    {
        "id": 4,
        "title": "Python Developer Intern",
        "company": "Delta Solutions",
        "location": "Baltimore, MD",
        "skills": ["Python", "FastAPI", "Docker"]
    },
    {
        "id": 5,
        "title": "Backend Engineering Intern",
        "company": "CloudNine Inc",
        "location": "Remote",
        "skills": ["Python", "PostgreSQL", "AWS"]
    },
    {
        "id": 6,
        "title": "Frontend Developer Intern",
        "company": "PixelWorks",
        "location": "New York, NY",
        "skills": ["JavaScript", "React", "TypeScript"]
    },
    {
        "id": 7,
        "title": "Machine Learning Intern",
        "company": "DataSense AI",
        "location": "Remote",
        "skills": ["Python", "TensorFlow", "Pandas"]
    },
    {
        "id": 8,
        "title": "IT Support Intern",
        "company": "Morgan Systems",
        "location": "Baltimore, MD",
        "skills": ["Networking", "Windows", "Troubleshooting"]
    },
    {
        "id": 9,
        "title": "Cybersecurity Intern",
        "company": "SecureNet",
        "location": "Remote",
        "skills": ["Linux", "Network Security", "Python"]
    },
    {
        "id": 10,
        "title": "Cloud Engineering Intern",
        "company": "SkyStack",
        "location": "Washington, DC",
        "skills": ["AWS", "Docker", "Linux"]
    }
]



@app.get("/jobs")
def search_jobs(search: str = ""):
    results = []
    search = search.strip().lower()
    for job in jobs:
        details = " ".join([job["title"], job["company"], job["location"]] + job["skills"]).lower()
        if search in details:
            results.append(job)
    return results

@app.post("/saved_jobs/{job_id}")
def save_job(job_id: int):
    job = next((job for job in jobs if job["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    database.save_job(job_id)
    return {"message": "Job saved successfully"}


@app.get("/saved_jobs")
def get_saved_jobs():
    saved_job_ids = database.get_saved_job_ids()
    return [job for job in jobs if job["id"] in saved_job_ids]

@app.delete("/saved_jobs/{job_id}")

def unsave_job(job_id: int):
    removed = database.remove_saved_job(job_id)

    if not removed:
        raise HTTPException(status_code=404, detail="Saved job not found")

    return {"message": "Job unsaved successfully"}


@app.post("/applications/{job_id}")
def add_application(job_id: int):
    job = next((job for job in jobs if job["id"] == job_id), None)

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    database.add_application(job_id)

    return {"message": "Application recorded successfully"}


@app.get("/applications")
def get_applications():
    records = database.get_applications()
    results = []

    for record in records:
        job = next(
            (job for job in jobs if job["id"] == record["job_id"]),
            None
        )

        if job is not None:
            results.append({
                **job,
                "status": record["status"],
                "applied_at": record["applied_at"]
            })

    return results


@app.get("/recommendations")
def recommend_jobs(skills: str = ""):
    if not skills.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter at least one skill"
        )

    return match_jobs(skills, jobs)