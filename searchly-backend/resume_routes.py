
import io
import re
import zipfile

from pathlib import Path

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile
)

from pypdf import PdfReader
from docx import Document

from resume_skills import analyze_resume_skills
from job_requirements import extract_requirements


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume Review"]
)

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_PAGES = 20


def extract_pdf_text(content):
    reader = PdfReader(io.BytesIO(content))

    if reader.is_encrypted:
        raise HTTPException(
            status_code=422,
            detail="Please upload an unlocked PDF."
        )

    if len(reader.pages) > MAX_PAGES:
        raise HTTPException(
            status_code=413,
            detail="Resume must be 20 pages or fewer."
        )

    return "\n".join(
        page.extract_text() or ""
        for page in reader.pages
    )


def extract_docx_text(content):
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        members = archive.infolist()

        total_size = sum(
            member.file_size for member in members
        )

        if len(members) > 300 or total_size > 25_000_000:
            raise HTTPException(
                status_code=413,
                detail="Word document is too large."
            )

    document = Document(io.BytesIO(content))
    sections = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            sections.append(paragraph.text)

    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    sections.append(cell.text)

    return "\n".join(sections)


def read_resume(filename, content):
    extension = Path(filename).suffix.lower()

    if extension not in {".pdf", ".docx"}:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported."
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Maximum file size is 5 MB."
        )

    try:
        if extension == ".pdf":
            text = extract_pdf_text(content)
        else:
            text = extract_docx_text(content)

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=422,
            detail="Unable to read resume."
        ) from error

    text = re.sub(r"[ \t]+", " ", text).strip()

    if len(text) < 40:
        raise HTTPException(
            status_code=422,
            detail="Not enough readable text found."
        )

    return text[:100000]


@router.post("/review")
async def review_resume(
    resume: UploadFile = File(...),
    job_description: str = Form("")
):
    filename = Path(
        resume.filename or "resume"
    ).name

    content = await resume.read(MAX_FILE_SIZE + 1)
    await resume.close()

    resume_text = read_resume(filename, content)

    # Detect technical AND transferable skills
    resume_analysis = analyze_resume_skills(
        resume_text
    )

    resume_skills = resume_analysis["all_skills"]

    # Analyze the job description using
    # the same skill recognition system
    description = job_description.strip()[:15000]

    job_analysis = (
        analyze_resume_skills(description)
        if description else {
            "all_skills": []
        }
    )

    job_skills = job_analysis["all_skills"]

    resume_skill_set = {
        skill.casefold()
        for skill in resume_skills
    }

    matching_skills = [
        skill for skill in job_skills
        if skill.casefold() in resume_skill_set
    ]

    not_found_skills = [
        skill for skill in job_skills
        if skill.casefold() not in resume_skill_set
    ]

    coverage = None

    if job_skills:
        coverage = round(
            100 * len(matching_skills) / len(job_skills)
        )

    suggestions = []

    if resume_analysis["technical_skills"]:
        suggestions.append(
            "Use specific project or work examples "
            "to demonstrate your technical skills."
        )

    if resume_analysis["transferable_skills"]:
        suggestions.append(
            "Your resume includes transferable skills. "
            "Explain what you did and the results "
            "you achieved in each relevant role."
        )

    if not resume_skills:
        suggestions.append(
            "No skills from Searchly's current dictionaries "
            "were identified. This does not mean "
            "you have no skills."
        )

    if matching_skills:
        suggestions.append(
            "Where accurate, emphasize your experience "
            "using " + ", ".join(matching_skills[:5]) + "."
        )

    if not_found_skills:
        suggestions.append(
            "Review these skills mentioned in the job: "
            + ", ".join(not_found_skills[:8])
            + ". Only add them to your resume "
            "if you genuinely have that experience."
        )

    if description and not job_skills:
        suggestions.append(
            "No recognizable skills were found in "
            "the supplied job description. "
            "Review its requirements manually."
        )

    suggestions.append(
        "Use clear examples of responsibilities "
        "and measurable achievements where possible."
    )

    requirements = (
        extract_requirements(description)
        if description else None
    )

    return {
        "filename": filename,

        # Compatible with existing ResumeReview.jsx
        "resume_skills": resume_skills,

        # New detailed categories
        "technical_skills": resume_analysis[
            "technical_skills"
        ],
        "transferable_skills": resume_analysis[
            "transferable_skills"
        ],
        "skill_evidence": resume_analysis[
            "skill_evidence"
        ],

        "job_skills": job_skills,
        "matching_skills": matching_skills,
        "not_found_skills": not_found_skills,
        "keyword_coverage": coverage,
        "job_requirements": requirements,
        "suggestions": suggestions,

        "method": "Technical and transferable skill extraction",
        "note": (
            "Results reflect detected evidence, "
            "not verified proficiency or hiring likelihood."
        )
    }
