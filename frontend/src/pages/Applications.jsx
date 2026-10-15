
import { useState, useEffect } from "react";

export default function Applications() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingJobId, setRemovingJobId] = useState(null);
  const [applyingJobId, setApplyingJobId] = useState(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        const [savedResponse, applicationsResponse] = await Promise.all([
          fetch("/saved_jobs"),
          fetch("/applications")
        ]);

        if (!savedResponse.ok || !applicationsResponse.ok) {
          throw new Error("Failed to load jobs");
        }

        const saved = await savedResponse.json();
        const applied = await applicationsResponse.json();

        setSavedJobs(saved);
        setApplications(applied);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  const handleUnsaveJob = async (jobId) => {
    setError("");
    setRemovingJobId(jobId);

    try {
      const response = await fetch(`/saved_jobs/${jobId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to unsave job");
      }

      setSavedJobs(currentJobs =>
        currentJobs.filter(job => job.id !== jobId)
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setRemovingJobId(null);
    }
  };

  const handleMarkAsApplied = async (jobId) => {
    setError("");
    setApplyingJobId(jobId);

    try {
      const response = await fetch(`/applications/${jobId}`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to record application");
      }

      const applicationsResponse = await fetch("/applications");

      if (!applicationsResponse.ok) {
        throw new Error("Failed to refresh applications");
      }

      const updatedApplications = await applicationsResponse.json();
      setApplications(updatedApplications);
    } catch (error) {
      setError(error.message);
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">
        My applications
      </h1>

      <p className="mt-2 text-muted">
        Track every role you've saved or applied to in one place.
      </p>

      {loading && (
        <p className="mt-6 text-muted">Loading jobs...</p>
      )}

      {error && (
        <p role="alert" className="mt-6 text-red-600">
          {error}
        </p>
      )}

      {!loading && (
        <>
          <div className="mt-8">
            <h2 className="text-xl font-bold">
              Saved Jobs ({savedJobs.length})
            </h2>

            {savedJobs.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
                <p className="font-semibold">No saved jobs yet</p>
                <p className="mt-2 text-muted">
                  Go to Find Jobs to save your first job.
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                {savedJobs.map(job => {
                  const alreadyApplied = applications.some(
                    application => application.id === job.id
                  );

                  return (
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

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleMarkAsApplied(job.id)}
                          disabled={alreadyApplied || applyingJobId === job.id}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:bg-gray-400"
                        >
                          {alreadyApplied
                            ? "Applied"
                            : applyingJobId === job.id
                              ? "Saving..."
                              : "Mark as Applied"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUnsaveJob(job.id)}
                          disabled={removingJobId === job.id}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {removingJobId === job.id
                            ? "Removing..."
                            : "Unsave"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-bold">
              Applied Jobs ({applications.length})
            </h2>

            {applications.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
                <p className="font-semibold">No applications yet</p>
                <p className="mt-1 text-muted">
                  Jobs you apply to will appear here.
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                {applications.map(job => (
                  <li key={job.id} className="p-5">
                    <h3 className="text-lg font-bold">{job.title}</h3>
                    <p className="text-muted">
                      {job.company}, {job.location}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-muted">Status:</span>
                      <span className="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        {job.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-muted">
                      Recorded: {job.applied_at}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
