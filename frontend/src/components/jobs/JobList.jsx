import { useState, useEffect } from "react";
import JobCard from "./JobCard";
import { searchJobs } from "../../services/api";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    loadJobs("");
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    loadJobs(search);
  }

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading jobs...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p>No jobs found.</p>
      )}

      {!loading && !error && jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}