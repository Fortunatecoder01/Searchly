
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

        # Add archive support without deleting old records
        columns = {
            row[1] for row in connection.execute(
                "PRAGMA table_info(applications)"
            ).fetchall()
        }

        if "archived" not in columns:
            connection.execute(
                "ALTER TABLE applications "
                "ADD COLUMN archived INTEGER NOT NULL DEFAULT 0"
            )


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
            "INSERT INTO applications (job_id) VALUES (?) "
            "ON CONFLICT(job_id) DO UPDATE SET archived = 0",
            (job_id,)
        )


def get_applications():
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            "SELECT job_id, status, applied_at, archived "
            "FROM applications"
        ).fetchall()

    return [
        {
            "job_id": row[0],
            "status": row[1],
            "applied_at": row[2],
            "archived": bool(row[3])
        }
        for row in rows
    ]


def update_application_status(job_id, status):
    with sqlite3.connect(DB_PATH) as connection:
        cursor = connection.execute(
            "UPDATE applications SET status = ? WHERE job_id = ?",
            (status, job_id)
        )
        return cursor.rowcount > 0


def archive_application(job_id):
    with sqlite3.connect(DB_PATH) as connection:
        cursor = connection.execute(
            "UPDATE applications SET archived = 1 WHERE job_id = ?",
            (job_id,)
        )
        return cursor.rowcount > 0


def restore_application(job_id):
    with sqlite3.connect(DB_PATH) as connection:
        cursor = connection.execute(
            "UPDATE applications SET archived = 0 WHERE job_id = ?",
            (job_id,)
        )
        return cursor.rowcount > 0

def create_live_saved_jobs_table():
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS live_saved_jobs (
                job_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                url TEXT NOT NULL,
                salary TEXT,
                saved_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)


def save_live_job(job):
    create_live_saved_jobs_table()

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            INSERT OR IGNORE INTO live_saved_jobs
            (job_id, title, company, location, url, salary)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            job["id"],
            job["title"],
            job["company"],
            job["location"],
            job["url"],
            job.get("salary", "")
        ))


def get_live_saved_jobs():
    create_live_saved_jobs_table()

    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row

        rows = connection.execute(
            "SELECT * FROM live_saved_jobs"
        ).fetchall()

    return [dict(row) for row in rows]

# Store applications for real jobs independently
# of saved jobs so unsaving never erases history.

def create_live_applications_table():
    create_live_saved_jobs_table()

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS live_applications (
                job_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT NOT NULL DEFAULT '',
                url TEXT NOT NULL,
                salary TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Applied',
                applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
                archived INTEGER NOT NULL DEFAULT 0
            )
        """)


def remove_live_saved_job(job_id):
    create_live_saved_jobs_table()

    with sqlite3.connect(DB_PATH) as connection:
        cursor = connection.execute(
            "DELETE FROM live_saved_jobs WHERE job_id = ?",
            (job_id,)
        )
        return cursor.rowcount > 0


def add_live_application(job_id):
    create_live_applications_table()

    with sqlite3.connect(DB_PATH) as connection:
        saved = connection.execute("""
            SELECT job_id, title, company, location, url, salary
            FROM live_saved_jobs
            WHERE job_id = ?
        """, (job_id,)).fetchone()

        if saved is None:
            return False

        connection.execute("""
            INSERT INTO live_applications
            (job_id, title, company, location, url, salary)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id)
            DO UPDATE SET archived = 0
        """, saved)

        return True


def get_live_applications():
    create_live_applications_table()

    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row

        rows = connection.execute(
            "SELECT * FROM live_applications "
            "ORDER BY applied_at DESC"
        ).fetchall()

    return [
        {
            **dict(row),
            "id": row["job_id"],
            "archived": bool(row["archived"])
        }
        for row in rows
    ]


def update_live_application_status(job_id, status):
    create_live_applications_table()

    with sqlite3.connect(DB_PATH) as connection:
        cursor = connection.execute(
            "UPDATE live_applications "
            "SET status = ? WHERE job_id = ?",
            (status, job_id)
        )
        return cursor.rowcount > 0


def set_live_application_archived(job_id, archived):
    create_live_applications_table()

    with sqlite3.connect(DB_PATH) as connection:
        cursor = connection.execute(
            "UPDATE live_applications "
            "SET archived = ? WHERE job_id = ?",
            (int(archived), job_id)
        )
        return cursor.rowcount > 0
