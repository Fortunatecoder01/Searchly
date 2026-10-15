
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def match_jobs(user_skills, jobs):
    if not user_skills.strip() or not jobs:
        return []

    job_texts = [
        " ".join(job["skills"])
        for job in jobs
    ]

    model = TfidfVectorizer(ngram_range=(1, 2))

    job_vectors = model.fit_transform(job_texts)

    user_vector = model.transform(
        [user_skills.replace(",", " ")]
    )

    scores = cosine_similarity(
        user_vector, job_vectors
    )[0]

    results = []

    for job, score in zip(jobs, scores):
        if score > 0:
            results.append({
                **job,
                "match_score": round(float(score), 3)
            })

    results.sort(
        key=lambda job: job["match_score"],
        reverse=True
    )

    return results