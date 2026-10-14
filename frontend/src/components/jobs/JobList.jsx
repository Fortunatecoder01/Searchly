import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import JobCard from "./JobCard";
import Button from "../ui/Button";
import Input from "../ui/input";
import Spinner from "../ui/Spinner";
import { searchJobs } from "../../services/api";

export default function JobList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState(query);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadJobs(searchTerm) {
    setLoading(true);
    setError("");

    try {
      const results = await searchJobs(searchTerm);
      setJobs(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Re-run the search whenever the ?q= in the URL changes (from Home or this form)
  useEffect(() => {
    setSearch(query);
    loadJobs(query);
  }, [query]);

  function handleSearch(event) {
    event.preventDefault();
    setSearchParams(search.trim() ? { q: search.trim() } : {});
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="job-search" className="sr-only">Search jobs</label>
        <Input
          id="job-search"
          type="text"
          placeholder="Search by job title"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-8">
        {loading && <Spinner label="Loading jobs" />}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            Couldn't load jobs. Make sure the backend is running on port 8000, then search again.
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
            <p className="font-semibold">No jobs match “{query}”</p>
            <p className="mt-1 text-muted">Try a broader title, like “Intern” or “Developer”.</p>
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted">
              {jobs.length} {jobs.length === 1 ? "role" : "roles"}
              {query && <> for “{query}”</>}
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
