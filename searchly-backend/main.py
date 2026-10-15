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
    },
    {
        "id": 11,
        "title": "Help Desk Intern",
        "company": "SAIC",
        "location": "Maryland",
        "skills": ["Hardware Support", "Active Directory"]
    },
    {
        "id": 12,
        "title": "IT Help Desk Technician",
        "company": "Deloitte",
        "location": "Virginia",
        "skills": [ "Windows", "Hardware Troubleshooting"]
    },
    {
        "id": 13,
        "title": "Junior IT Support Specialist",
        "company": "General Dynamics",
        "location": "Florida",
        "skills": ["Remote Support", "Microsoft 365"]
    },
    {
        "id": 14,
        "title": "Service Desk Analyst",
        "company": "TCS",
        "location": "Baltimore, MD",
        "skills": ["Technical Support", "Ticket Management"]
    },
    {
        "id": 15,
        "title": "Desktop Support Technician",
        "company": "Capital One",
        "location": "Virginia",
        "skills": ["Windows", "Imaging"]
    },
    {
        "id": 16,
        "title": "Technical Support Representative",
        "company": "Dell",
        "location": "Texas",
        "skills": ["Troubleshooting", "Customer Support"]
    },
    {
        "id": 17,
        "title": "Junior Systems Administrator",
        "company": "Lockheed Martin",
        "location": "Colorado",
        "skills": ["Powershell", "Windows Server"]
    },
    {
        "id": 18,
        "title": "IT Operations Analyst (Entry-Level)",
        "company": "PwC",
        "location": "Detroit, MC",
        "skills": ["Monitoring", "Documentation", "Incident Management"]
    },
    {
        "id": 19,
        "title": "Computer Support Specialist",
        "company": "Radford University",
        "location": "Virginia",
        "skills": ["Windows", "Networking", "Hardware Support"]
    },
    {
        "id": 20,
        "title": "Cloud Support Associate",
        "company": "Microsoft Azure",
        "location": "Washington",
        "skills": ["AWS", "Networking Fundamentals", "Linux"]
    },
    {
        "id": 21,
        "title": "Cloud Operations Intern",
        "company": "Google Cloud",
        "location": "Georgia",
        "skills": ["Azure", "Linux", "Monitoring Tools"]
    },
    {
        "id": 22,
        "title": "Junior Cloud Engineer",
        "company": "IBM",
        "location": "Chicago, IL",
        "skills": ["Terraform", "AWS", "Python"]
    },
    {
        "id": 23,
        "title": "DevOps Intern",
        "company": "Red Hat",
        "location": "North Carolina",
        "skills": ["Linux", "Docker", "Git"]
    },
    {
        "id": 24,
        "title": "Junior DevOps Engineer",
        "company": "Capital One",
        "location": "Virginia",
        "skills": ["Jenkins", "GitHub"]
    },
    {
        "id": 25,
        "title": "Cloud Infrastructure Analyst",
        "company": "KPMG",
        "location": "Boston, MA",
        "skills": ["Networking", "Virtualization", "AWS"]
    },
    {
        "id": 26,
        "title": "Associate Cloud Engineer",
        "company": "Google",
        "location": "Remote",
        "skills": ["Linux", "Scripting", "Azure"]
    },
    {
        "id": 27,
        "title": "Site Reliability Engineer Intern",
        "company": "IBM",
        "location": "Texas",
        "skills": ["Linux", "Python", "Monitoring"]
    },
    {
        "id": 28,
        "title": "Kubernetes Intern",
        "company": "NVIDIA",
        "location": "California",
        "skills": ["Docker", "Containers", "Linux"]
    },
    {
        "id": 29,
        "title": "Information Security Intern",
        "company": "Exelon",
        "location": "Maryland",
        "skills": ["Compliance", "Documentation", "Security Awareness"]
    },
    {
        "id": 30,
        "title": "SOC Analyst",
        "company": "Leidos",
        "location": "Virginia",
        "skills": ["Threat Monitoring", "Splunk"]
    },
    {
        "id": 31,
        "title": "Junior Cybersecurity Analyst",
        "company": "Censeo Consulting Group",
        "location": "Washington",
        "skills": ["Incident Response", "Networking", "Security"]
    },
    {
        "id": 32,
        "title": "Cyber Defense Analyst",
        "company": "System One",
        "location": "Washington",
        "skills": ["Threat Analysis", "Security Monitoring"]
    },
    {
        "id": 33,
        "title": "Security Operations Intern",
        "company": "Sheppard Pratt",
        "location": "Maryland",
        "skills": ["Log Analysis", "Linux"]
    },
    {
        "id": 34,
        "title": "Junior Data Analyst",
        "company": "Index Analytics LLC",
        "location": "Maryland",
        "skills": ["SQL", "Reporting"]
    },
    {
        "id": 35,
        "title": "Data Engineering Intern",
        "company": "Stanley Black & Decker, Inc",
        "location": "Maryland",
        "skills": ["Python", "SQL", "ETL"]
    },
    {
        "id": 36,
        "title": "Junior Data Engineer",
        "company": "SynergisticIT",
        "location": "Remote",
        "skills": ["Python", "SQL", "Cloud Platforms"]
    },
    {
        "id": 37,
        "title": "Reporting Analyst",
        "company": "Transamerica",
        "location": "Maryland",
        "skills": ["Excel", "SQL"]
    },
    {
        "id": 38,
        "title": "Analytics Intern",
        "company": "Stripe",
        "location": "New York",
        "skills": ["Excel", "Statistics", "Python"]
    },
    {
        "id": 39,
        "title": "Software Engineer Intern",
        "company": "RTX Corp",
        "location": "Maryland",
        "skills": ["Python", "Git", "Java", "Data Structures"]
    },
    {
        "id": 40,
        "title": "Software Developer Intern",
        "company": "IBM",
        "location": "Texas",
        "skills": ["Java", "C++", "Python"]
    },
    {
        "id": 41,
        "title": "Junior Software Developer",
        "company": "T-Rex Solutions LLC",
        "location": "Maryland",
        "skills": ["APIs", "Databases", "Java"]
    },
    {
        "id": 42,
        "title": "Full-Stack Developer Intern",
        "company": "Lockheed Martin",
        "location": "Texas",
        "skills": ["React", "SQL", "Node.js"]
    },
    {
        "id": 43,
        "title": "Front-End Developer Intern",
        "company": "Verkada",
        "location": "California",
        "skills": ["JavaScript", "HTML", "CSS"]
    },
    {
        "id": 44,
        "title": "Back-End Developer Intern",
        "company": "Robinhood",
        "location": "New York",
        "skills": ["Java", "APIs"]
    },
    {
        "id": 45,
        "title": "Mobile Application Developer Intern",
        "company": "Comentum Corp",
        "location": "California",
        "skills": ["Kotlin", "Flutter", "Swift"]
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
