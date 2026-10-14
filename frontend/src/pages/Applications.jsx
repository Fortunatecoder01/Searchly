
import { useState, useEffect } from "react";

export default function Applications() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSavedJobs() {
      try {
        const response = await fetch("/saved_jobs");

        if (!response.ok) {
          throw new Error("Failed to load saved jobs");
        }

        const jobs = await response.json();
        setSavedJobs(jobs);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadSavedJobs();
  }, []);

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">
        My applications
      </h1>

      <p className="mt-2 text-muted">
        Track every role you've saved or applied to in one place.
      </p>

      <div className="mt-8">
        <h2 className="text-xl font-bold">
          Saved Jobs ({savedJobs.length})
        </h2>

        {loading && (
          <p className="mt-4 text-muted">Loading saved jobs...</p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && savedJobs.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <p className="font-semibold">No saved jobs yet</p>
            <p className="mt-2 text-muted">
              Go to Find Jobs to save your first job.
            </p>
          </div>
        )}

        {!loading && !error && savedJobs.length > 0 && (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {savedJobs.map(job => (
              <li key={job.id} className="p-5">
                <h3 className="text-lg font-bold">{job.title}</h3>

                <p className="text-muted">
                  {job.company}, {job.location}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {job.skills.map(skill => (
                    <span
                      key={skill}
                      className="rounded-md border border-line bg-canvas px-2 py-1 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold">Applied Jobs</h2>

        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <p className="font-semibold">No applications yet</p>

          <p className="mt-1 text-muted">
            Jobs you apply to will appear here.
          </p>
        </div>
      </div>
    </section>
  );
}