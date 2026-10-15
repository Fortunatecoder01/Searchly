
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import JobCard from "./JobCard";
import Button from "../ui/Button";
import Input from "../ui/input";
import Spinner from "../ui/Spinner";
import { searchJobs, recommendJobs } from "../../services/api";

export default function JobList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState(query);
  const [skills, setSkills] = useState("");
  const [matchedSkills, setMatchedSkills] = useState("");
  const [isMatchMode, setIsMatchMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadJobs(searchTerm) {
    setLoading(true);
    setError("");
    setIsMatchMode(false);

    try {
      const results = await searchJobs(searchTerm);
      setJobs(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSearch(query);
    loadJobs(query);
  }, [query]);

  function handleSearch(event) {
    event.preventDefault();

    const searchTerm = search.trim();

    if (searchTerm === query) {
      loadJobs(searchTerm);
    } else {
      setSearchParams(searchTerm ? { q: searchTerm } : {});
    }
  }

  async function handleMatch(event) {
    event.preventDefault();

    const enteredSkills = skills.trim();

    if (!enteredSkills) {
      setError("Please enter at least one skill.");
      return;
    }

    setLoading(true);
    setError("");
    setIsMatchMode(true);
    setMatchedSkills(enteredSkills);

    try {
      const results = await recommendJobs(enteredSkills);
      setJobs(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="job-search" className="sr-only">
          Search jobs
        </label>

        <Input
          id="job-search"
          type="text"
          placeholder="Search by job title"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        <Button type="submit">Search</Button>
      </form>

      <div className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-bold">
          Find Jobs That Match Your Skills
        </h2>

        <p className="mt-1 text-sm text-muted">
          Enter your skills to discover relevant job opportunities.
        </p>

        <form onSubmit={handleMatch} className="mt-4 flex flex-col sm:flex-row gap-3">
          <label htmlFor="student-skills" className="sr-only">
            Your skills
          </label>

          <Input
            id="student-skills"
            type="text"
            placeholder="Python, SQL, Pandas"
            value={skills}
            onChange={event => setSkills(event.target.value)}
          />

          <Button type="submit">
            Match Jobs
          </Button>
        </form>

        <p className="mt-2 text-xs text-muted">
          Recommendations are based on text similarity between your entered skills and the skills listed for each job.
        </p>
      </div>

      <div className="mt-8">
        {loading && <Spinner label="Loading jobs" />}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
            <p className="font-semibold">
              {isMatchMode
                ? "No jobs matched your entered skills."
                : `No jobs match "${query}"`}
            </p>

            <p className="mt-1 text-muted">
              Try different skills or a broader search.
            </p>
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            {isMatchMode && (
              <div className="mb-4">
                <h2 className="text-lg font-bold">
                  Recommended Jobs
                </h2>

                <p className="text-sm text-muted">
                  Based on: {matchedSkills}
                </p>
              </div>
            )}

            <p className="mb-3 text-sm text-muted">
              {jobs.length} {jobs.length === 1 ? "role" : "roles"}
              {isMatchMode
                ? " matched your skills"
                : query
                  ? ` for "${query}"`
                  : " available"}
            </p>

            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
              {jobs.map(job => (
                <li key={job.id}>
                  <JobCard job={job} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
