
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "searchly.db"


def create_database():
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS saved_jobs (
                job_id INTEGER PRIMARY KEY,
                saved_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                job_id INTEGER PRIMARY KEY,
                status TEXT NOT NULL DEFAULT 'Applied',
                applied_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)



def save_job(job_id):
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            "INSERT OR IGNORE INTO saved_jobs (job_id) VALUES (?)",
            (job_id,)
        )


def get_saved_job_ids():
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            "SELECT job_id FROM saved_jobs"
        ).fetchall()

    return [row[0] for row in rows]

def remove_saved_job(job_id):
    with sqlite3.connect(DB_PATH) as connection:
        cursor = connection.execute(
            "DELETE FROM saved_jobs WHERE job_id = ?",
            (job_id,)
        )
        return cursor.rowcount > 0

def add_application(job_id):
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            "INSERT OR IGNORE INTO applications (job_id) VALUES (?)",
            (job_id,)
        )


def get_applications():
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            "SELECT job_id, status, applied_at FROM applications"
        ).fetchall()

    return [
        {
            "job_id": row[0],
            "status": row[1],
            "applied_at": row[2]
        }
        for row in rows
    ]
