# Searchly
Searchly is an AI-powered web application that helps students and recent graduates find jobs and internships, review and improve resumes, manage applications, and track their job search progress.
python 3 and Node.js with npm is required
WHAT WORKs
. Search jobs by title, company, location or skill
. save or unsave jobs
. Record jobs as Applied and view them in My Applications
. Store saved jobs and application records in a local SQLite database
. Enter skills and get ranked job recommendations with similarity scores.
The matching feature uses TF IDf and cosine similarity through scikit learn. The scores measure similarity between entered skills and job skills. They are not
probabilities of getting hired
TECHNOLOGY USED
Frontend: React, Vite and Tailwind css
Backend: Python and FastApi
Database: SQLite
Job matching
HOW TO RUN SEARCHLY
You need Git, Python 3 and Node.js with npm. You can run the project on your computer or in GitHub Codespaces.
1. Get the code
Clone the repository and open its folder.
git clone https://github.com/Fortunatecoder01/Searchly.git
cd Searchly
If you are using GitHub Codespaces, open the repository, select Code, then Codespaces. Open your Codespace or create a new one. The repository will already be available in the Codespace.

2. Start the backend
Open a terminal in the project folder.
cd searchly-backend
python -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
The commands above work in Codespaces, Linux and macOS. On Windows PowerShell, activate the environment with venv\Scripts\Activate.ps1 instead of source venv/bin/activate.
If the virtual environment already exists, you can skip python -m venv venv. If the dependencies are already installed in it, you can also skip the install command.
Leave this terminal running. The backend uses port 8000.

3. Start the frontend
Open a second terminal from the main Searchly folder.
cd frontend
npm ci
npm run dev -- --host 0.0.0.0
Leave this terminal running as well. Vite normally uses port 5173.
Open the frontend URL displayed by Vite. In GitHub Codespaces, use the Ports tab to open the forwarded link for port 5173. The FastAPI documentation is available through port 8000 at /docs.

5. Test the application
On the Find Jobs page, search for Python or Developer to see sample job listings.
Click Save Job and visit My Applications to view saved jobs. The application tracking section allows a user to record an application as Applied. This does not send an application to an employer.
For skill matching, enter JavaScript, React in the skills input and click Match Jobs. Searchly should show matching jobs with similarity scores. You can also try Python, SQL to see a different ranking.
You can test the recommendation API directly from a terminal while FastAPI is running:
curl -G --data-urlencode "skills=Python, SQL" http://localhost:8000/recommendations


Database information

When the backend starts, database.py creates the local SQLite database and its tables if they do not already exist. The searchly.db file is not stored on GitHub. A new computer or new Codespace starts with an empty set of saved jobs and applications.

Saved records remain available when you restart FastAPI in the same environment. The database is currently local, so data is not shared between computers.

Current limitations and next steps

Searchly currently uses fictional sample job listings. Students enter their skills manually, and the matching system compares those skills with the skills stored for each job.

We plan to add resume uploads, automatic extraction of skills and relevant work or project experience, improved matching, user login, and shared database storage. Any future real application submission should require the student’s approval.

