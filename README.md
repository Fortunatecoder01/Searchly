Searchly
Searchly is a web application we are developing to help students, graduates, and other job seekers find jobs that match their skills and experience. The goal is to make job searching easier by having job listings, recommendations, resume tools, and application tracking in one place.

What Searchly Does
Searchly gets real job listings from Remotive and Himalayas. Users can search for jobs, filter the results by different requirements, and save jobs they are interested in. The application currently focuses on remote jobs that accept applicants from the United States.

We also have a Search Agent that recommends jobs based on the user’s preferred role, education, skills, and experience. It compares the user’s information with available job listings and explains why certain jobs may be a good match.

Users can upload their resumes in PDF or Word format. Searchly can identify technical and transferable skills, compare a resume with a job description, and suggest improvements.

There is also a resume builder that allows users to generate a resume based on their existing information and the position they are applying for. The generated resume can be edited and downloaded as a Word document.

Searchly also allows users to save jobs and keep track of their applications. Users can update their application status and view their progress through the application dashboard.

How We Built It
The frontend uses React, Vite, and Tailwind CSS. These handle the pages, navigation, and user interface.

The backend uses Python and FastAPI. It handles requests from the frontend, retrieves job listings, processes resumes, and manages application information.

We use SQLite to store saved jobs and application records.

For job matching, Searchly uses TF-IDF and cosine similarity to compare relevant text. We also connected a pretrained language model through Groq to help with job recommendations, resume analysis, and resume generation.

How to Run Searchly
First, clone the repository and open the project.

For the backend, open the searchly-backend folder and install the required Python packages using:

python -m pip install -r requirements.txt

Start the backend with:

uvicorn main:app --reload --host 0.0.0.0 --port 8000

For the frontend, open the frontend folder and install the dependencies using:

npm install

Start the frontend with:

npm run dev -- --host 0.0.0.0

The application will run locally through Vite, usually on port 5173.

The resume and language model tools require a Groq API key. The key should be stored as an environment secret named GROQ_API_KEY and should not be uploaded to GitHub.

What We Are Still Working On
We still need to finish user registration and login so each user can have their own account and private saved information.

We also plan to expand our job sources to include more internships, part-time jobs, and local opportunities.

Other remaining work includes improving the recommendation accuracy, testing the application, and preparing it for deployment.

Project Goal
Our goal is to make Searchly a platform where someone can find a job, understand how well their experience matches the requirements, improve their resume, and track their applications without having to use several different websites.

Searchly is still under development, but the main job search, resume, recommendation, and application tracking tools have been implemented.
