
import { useEffect, useState } from "react";
import ResumeReview from "../components/agent/ResumeReview";

import ResumeAgentPanel from "../components/agent/ResumeAgentPanel";

function summarizeLocation(location) {
  const text = String(location || "Not specified");

  if (text.length <= 110) {
    return text;
  }

  const includesUSA =
    /\b(united states|usa|u\.s\.)\b/i.test(text);

  return includesUSA
    ? "Multiple eligible countries, including USA"
    : "Multiple eligible countries";
}

const initialForm = {
  role: "",
  major: "",
  skills: "",
  education: "not_specified",
  years_experience: 0,
  experience_level: "student",
  limit: 10
};

export default function AgentRun() {
  const [form, setForm] = useState(initialForm);
  const [results, setResults] = useState([]);
  const [savedIds, setSavedIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [jobsConsidered, setJobsConsidered] = useState(0);
  const [agentMethod, setAgentMethod] = useState("");

  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSavedJobs() {
      try {
        const response = await fetch("/live/saved_jobs");

        if (!response.ok) {
          throw new Error("Unable to load saved jobs");
        }

        const jobs = await response.json();

        if (active) {
          setSavedIds(
            jobs.map(job => String(job.job_id))
          );
        }
      } catch (err) {
        if (active) {
          setSaveError(err.message);
        }
      }
    }

    loadSavedJobs();

    return () => {
      active = false;
    };
  }, []);

  const updateForm = (field, value) => {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  };

  // Search real jobs using the backend agent
  const handleSearch = async event => {
    event.preventDefault();

    setError("");
    setResults([]);
    setLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        "/api/agent/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      if (!response.ok) {
        let message = "Search Agent could not complete the search.";

        try {
          const data = await response.json();

          if (typeof data.detail === "string") {
            message = data.detail;
          }
        } catch {
          // Keep the default error message
        }

        throw new Error(message);
      }

      const data = await response.json();

      setResults(data.results || []);
      setJobsConsidered(data.jobs_considered || 0);
      setAgentMethod(data.method || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save recommended real jobs
  const handleSave = async job => {
    const id = String(job.id);
    const alreadySaved = savedIds.includes(id);

    setSaveError("");
    setSavingId(id);

    try {
      const response = await fetch(
        alreadySaved
          ? `/live/saved_jobs/${encodeURIComponent(id)}`
          : "/live/saved_jobs",
        alreadySaved
          ? {
              method: "DELETE"
            }
          : {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location || "",
                url: job.url,
                salary: job.salary || ""
              })
            }
      );

      if (!response.ok) {
        throw new Error(
          alreadySaved
            ? "Unable to unsave job"
            : "Unable to save job"
        );
      }

      setSavedIds(current =>
        alreadySaved
          ? current.filter(item => item !== id)
          : [...new Set([...current, id])]
      );
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Search Agent
      </h1>

      <p className="mt-2 max-w-2xl text-muted">
        Tell Searchly about your education, skills,
        experience and career goals. It will search
        real jobs and suggest relevant opportunities.
      </p>

            <ResumeAgentPanel
        onResults={(data) => {
          setResults(data.results || []);
          setJobsConsidered(data.jobs_considered || 0);
          setHasSearched(true);
          setError("");
          setAgentMethod(data.method || "");
        }}
      />

{/* User career profile */}
      <form
        onSubmit={handleSearch}
        className="mt-8 rounded-2xl border border-line bg-white p-6"
      >
        <h2 className="text-xl font-bold">
          Your Career Profile
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Enter the information you want the agent to use.
          Your answers are sent to the Searchly backend
          for this search.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="text-sm font-medium">
            What role are you looking for?

            <input
              type="text"
              required
              minLength={2}
              value={form.role}
              onChange={e =>
                updateForm("role", e.target.value)
              }
              placeholder="Software Developer Intern"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-medium">
            Major or Field of Study

            <input
              type="text"
              value={form.major}
              onChange={e =>
                updateForm("major", e.target.value)
              }
              placeholder="Computer Science"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-medium md:col-span-2">
            Your Skills

            <input
              type="text"
              value={form.skills}
              onChange={e =>
                updateForm("skills", e.target.value)
              }
              placeholder="Python, SQL, React, FastAPI, Git"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 font-normal"
            />

            <span className="mt-1 block text-xs font-normal text-gray-500">
              Separate skills with commas.
            </span>
          </label>

          <label className="text-sm font-medium">
            Education Level

            <select
              value={form.education}
              onChange={e =>
                updateForm("education", e.target.value)
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 font-normal"
            >
              <option value="not_specified">
                Prefer not to specify
              </option>
              <option value="high_school">
                High School
              </option>
              <option value="associate">
                Associate Degree
              </option>
              <option value="bachelor">
                Bachelor's Degree
              </option>
              <option value="master">
                Master's Degree
              </option>
              <option value="doctorate">
                Doctoral Degree
              </option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Years of Relevant Work Experience

            <input
              type="number"
              min="0"
              max="40"
              value={form.years_experience}
              onChange={e =>
                updateForm(
                  "years_experience",
                  Number(e.target.value)
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-medium">
            Experience Filter

            <select
              value={form.experience_level}
              onChange={e =>
                updateForm(
                  "experience_level",
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 font-normal"
            >
              <option value="student">
                Student-friendly
              </option>
              <option value="early">
                Explicit Internships & Entry-level
              </option>
              <option value="all">
                All Experience Levels
              </option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Number of Recommendations

            <select
              value={form.limit}
              onChange={e =>
                updateForm(
                  "limit",
                  Number(e.target.value)
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 font-normal"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </label>
        </div>

        <p className="mt-5 text-xs text-gray-500">
          Current search coverage: remote jobs with US
          eligibility from Remotive and Himalayas.
          Local on-site jobs are not included yet.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? "Searching real jobs..."
            : "Start Search Agent"}
        </button>
      </form>

      {/* Search result errors */}
      {error && (
        <p role="alert" className="mt-6 text-red-600">
          {error}
        </p>
      )}

      {saveError && (
        <p role="alert" className="mt-6 text-red-600">
          {saveError}
        </p>
      )}

      {/* Results */}
      {hasSearched && !loading && !error && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold">
            Personalized Job Suggestions
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Considered {jobsConsidered} real job postings.
            Found {results.length} recommendations.
            Ranking method: {agentMethod || "text matching"}. Scores do not predict hiring success.
          </p>

          {results.length === 0 && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-6">
              <p className="font-semibold">
                No suitable matches found.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Try a broader role title, additional skills
                or All Experience Levels.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-5">
            {results.map((job, index) => {
              const isSaved = savedIds.includes(
                String(job.id)
              );

              const locationText = String(
                job.location || "Not specified"
              );

              return (
                <article
                  key={job.id}
                  className="rounded-xl border border-gray-200 bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-blue-600">
                        Recommendation #{index + 1}
                      </p>

                      <h3 className="mt-2 text-xl font-bold">
                        {job.title}
                      </h3>

                      <p className="mt-1 text-gray-600">
                        {job.company}
                      </p>
                    </div>

                    <div className="rounded-lg bg-blue-50 px-4 py-3 text-center">
                      <p className="text-xs text-blue-700">
                        Match score
                      </p>

                      <p className="text-2xl font-bold text-blue-700">
                        {Math.round(
                          job.match_score * 100
                        )}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    <p>
                      Location: {summarizeLocation(job.location)}
                    </p>

                    {locationText.length > 110 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600">
                          Show eligible locations
                        </summary>

                        <p className="mt-2 max-h-32 overflow-y-auto break-words">
                          {locationText}
                        </p>
                      </details>
                    )}

                    <p className="mt-2">
                      Education: {job.education || "N/A"}
                    </p>

                    <p className="mt-1">
                      Work Experience:{" "}
                      {job.work_experience || "N/A"}
                    </p>

                    {job.salary && (
                      <p className="mt-2 font-semibold text-green-700">
                        {job.salary}
                      </p>
                    )}
                  </div>

                  {/* Why the agent recommended it */}
                  <div className="mt-5 rounded-lg bg-green-50 p-4">
                    <h4 className="font-semibold text-green-800">
                      Why this job was recommended
                    </h4>

                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-green-900">
                      {(job.reasons || []).map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Qualifications and gaps */}
                  {job.cautions?.length > 0 && (
                    <div className="mt-4 rounded-lg bg-amber-50 p-4">
                      <h4 className="font-semibold text-amber-900">
                        Qualifications to review
                      </h4>

                      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-amber-900">
                        {job.cautions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSave(job)}
                      disabled={savingId === String(job.id)}
                      className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 disabled:opacity-50"
                    >
                      {savingId === String(job.id)
                        ? "Updating..."
                        : isSaved
                          ? "Unsave Job"
                          : "Save Job"}
                    </button>

                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                      >
                        View & Apply
                      </a>
                    )}

                    <span className="text-xs text-gray-500">
                      Source: {job.source}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Searchly's extracted qualifications can be
            incomplete. Verify the original listing before
            applying. Save Job does not submit an application.
          </p>
        </div>
      )}
      <ResumeReview />
    </section>
  );
}