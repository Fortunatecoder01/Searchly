
import { useEffect, useState } from "react";
import ApplicationDashboard from "../components/ApplicationDashboard";

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to load ${url}`);
  }

  return response.json();
}

export default function Applications() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [busyKey, setBusyKey] = useState(null);
  const [restoringJobId, setRestoringJobId] = useState(null);

  // Load real saved jobs and applications from SQLite
  async function refreshData() {
    const [saved, applied] = await Promise.all([
      getJson("/live/saved_jobs"),
      getJson("/live/applications")
    ]);

    setSavedJobs(saved);
    setApplications(applied);
  }

  useEffect(() => {
    refreshData()
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Convert saved real jobs into a consistent format
  const allSavedJobs = savedJobs.map(job => ({
    ...job,
    id: job.job_id,
    source: "live"
  }));

  // All real applications, including archived records
  const allApplications = applications.map(job => ({
    ...job,
    id: job.job_id,
    source: "live"
  }));

  // Archived jobs stay in the dashboard
  // but disappear from the active Applied Jobs list
  const activeApplications = allApplications.filter(
    job => !job.archived
  );

  // Search active applications
  const filteredApplications = activeApplications.filter(job => {
    const text = [
      job.title,
      job.company,
      job.location,
      job.status
    ].join(" ").toLowerCase();

    return text.includes(searchTerm.trim().toLowerCase());
  });

  // Send requests to the backend and refresh records
  async function runAction(key, url, method) {
    setError("");
    setBusyKey(key);

    try {
      const response = await fetch(url, { method });

      if (!response.ok) {
        let message = "Action failed";

        try {
          const data = await response.json();
          message = data.detail || message;
        } catch {
          // Use default error message
        }

        throw new Error(message);
      }

      await refreshData();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  // Restore an archived application
  async function handleRestore(jobId) {
    setRestoringJobId(jobId);

    try {
      await runAction(
        `restore-${jobId}`,
        `/live/applications/${encodeURIComponent(jobId)}/restore`,
        "PATCH"
      );
    } finally {
      setRestoringJobId(null);
    }
  }

  // Record an application or restore an archived one
  async function handleMarkAsApplied(job) {
    const existing = allApplications.find(
      application => application.id === job.id
    );

    if (existing?.archived) {
      await handleRestore(job.id);
      return;
    }

    if (existing) return;

    const confirmed = window.confirm(
      "Have you already applied for this job? Searchly will record it but will not submit an application to the employer."
    );

    if (!confirmed) return;

    await runAction(
      `apply-${job.id}`,
      `/live/applications/${encodeURIComponent(job.id)}`,
      "POST"
    );
  }

  // Unsave a real job without deleting its application history
  async function handleUnsave(job) {
    await runAction(
      `unsave-${job.id}`,
      `/live/saved_jobs/${encodeURIComponent(job.id)}`,
      "DELETE"
    );
  }

  // Update application status
  async function handleUpdateStatus(job, status) {
    await runAction(
      `status-${job.id}`,
      `/live/applications/${encodeURIComponent(job.id)}?status=${encodeURIComponent(status)}`,
      "PATCH"
    );
  }

  // Archive instead of permanently deleting
  async function handleArchive(job) {
    const confirmed = window.confirm(
      "Hide this job from Applied Jobs? It will remain in your dashboard history. This does not withdraw your actual application."
    );

    if (!confirmed) return;

    await runAction(
      `archive-${job.id}`,
      `/live/applications/${encodeURIComponent(job.id)}/archive`,
      "PATCH"
    );
  }

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">
        My Applications
      </h1>

      <p className="mt-2 text-muted">
        Manage your saved jobs, track applications, and monitor your progress.
      </p>

      {loading && (
        <p className="mt-6 text-muted">
          Loading applications...
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 text-red-600">
          {error}
        </p>
      )}

      {!loading && (
        <>
          {/* Application Dashboard */}
          <ApplicationDashboard
            applications={allApplications}
            onRestore={handleRestore}
            restoringJobId={restoringJobId}
          />

          {/* Saved Jobs */}
          <div className="mt-8">
            <h2 className="text-xl font-bold">
              Saved Jobs ({allSavedJobs.length})
            </h2>

            {allSavedJobs.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line bg-white p-8 text-center">
                <p className="font-semibold">
                  No saved jobs yet
                </p>

                <p className="mt-2 text-muted">
                  Go to Find Jobs to save real opportunities.
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                {allSavedJobs.map(job => {
                  const existing = allApplications.find(
                    application => application.id === job.id
                  );

                  return (
                    <li key={job.id} className="p-5">
                      <h3 className="text-lg font-bold">
                        {job.title}
                      </h3>

                      <p className="mt-1 text-muted">
                        {job.company}, {job.location}
                      </p>

                      {job.salary && (
                        <p className="mt-2 font-semibold text-green-700">
                          {job.salary}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleMarkAsApplied(job)}
                          disabled={
                            busyKey !== null ||
                            (existing && !existing.archived)
                          }
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:bg-gray-400"
                        >
                          {busyKey === `apply-${job.id}`
                            ? "Recording..."
                            : existing && !existing.archived
                              ? "Tracked"
                              : existing?.archived
                                ? "Restore to Applied Jobs"
                                : "Mark as Applied"}
                        </button>

                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-blue-300 px-4 py-2 text-sm text-blue-600"
                          >
                            View & Apply
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleUnsave(job)}
                          disabled={busyKey !== null}
                          className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
                        >
                          {busyKey === `unsave-${job.id}`
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

          {/* Applied Jobs */}
          <div className="mt-10">
            <h2 className="text-xl font-bold">
              Applied Jobs ({activeApplications.length})
            </h2>

            {/* Search bar */}
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search job title, company, location or status..."
              aria-label="Search applied jobs"
              className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
            />

            {filteredApplications.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line bg-white p-8 text-center">
                <p className="text-muted">
                  {activeApplications.length === 0
                    ? "No active applications yet."
                    : "No applications match your search."}
                </p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                {filteredApplications.map(job => (
                  <li key={job.id} className="p-5">
                    <h3 className="text-lg font-bold">
                      {job.title}
                    </h3>

                    <p className="mt-1 text-muted">
                      {job.company}, {job.location}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-muted">
                        Status:
                      </span>

                      <select
                        value={job.status}
                        onChange={e =>
                          handleUpdateStatus(job, e.target.value)
                        }
                        disabled={busyKey !== null}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offered">Offered</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      {/* Archive button */}
                      <button
                        type="button"
                        onClick={() => handleArchive(job)}
                        disabled={busyKey !== null}
                        title="Hide from Applied Jobs"
                        aria-label={`Archive ${job.title}`}
                        className="rounded-md border border-red-300 px-3 py-2 text-red-600 disabled:opacity-50"
                      >
                        {busyKey === `archive-${job.id}`
                          ? "Hiding..."
                          : "🗑️"}
                      </button>

                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-blue-300 px-3 py-2 text-sm text-blue-600"
                        >
                          Job Posting
                        </a>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-muted">
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
