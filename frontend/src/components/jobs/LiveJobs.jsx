
import { useState, useEffect } from "react";

const PAGE_SIZE = 10;

// Estimate experience level from available job information.
function getExperienceLevel(job) {
  const title = String(job.title || "").toLowerCase();

  const seniority = Array.isArray(job.seniority)
    ? job.seniority.join(" ").toLowerCase()
    : String(job.seniority || "").toLowerCase();

  const years = job.experience_min_years;

  const experiencedTitle =
    /\b(senior|sr|staff|principal|lead|architect|director|manager|executive|vp|head of|subject matter expert|sme)\b/;

  const experiencedSeniority =
    /\b(mid[- ]?level|senior|manager|director|executive)\b/;

  // Check experienced roles first
  if (
    experiencedTitle.test(title) ||
    experiencedSeniority.test(seniority) ||
    (typeof years === "number" && years >= 4)
  ) {
    return "experienced";
  }

  const earlyTitle =
    /\b(intern|internship|junior|entry[\s-]?level|new[\s-]?grad|graduate|apprentice|trainee|associate)\b/;

  const earlySeniority =
    /\b(entry[\s-]?level|junior|intern)\b/;

  if (
    earlyTitle.test(title) ||
    earlySeniority.test(seniority)
  ) {
    return "early";
  }

  if (
    typeof years === "number" &&
    years <= 2
  ) {
    return "possible";
  }

  return "unknown";
}


export default function LiveJobs() {
  const [jobs, setJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [savedIds, setSavedIds] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const [view, setView] = useState("browse");

  const [experienceFilter, setExperienceFilter] =
    useState("student");

  const [category, setCategory] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [location, setLocation] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [browseError, setBrowseError] = useState("");
  const [matchError, setMatchError] = useState("");
  const [actionError, setActionError] = useState("");

  // Load saved jobs
  useEffect(() => {
    let active = true;

    async function loadSavedJobs() {
      try {
        const response = await fetch("/live/saved_jobs");

        if (!response.ok) {
          throw new Error("Unable to load saved jobs");
        }

        const data = await response.json();

        if (active) {
          setSavedIds(
            data.map(job => String(job.job_id))
          );
        }
      } catch (error) {
        if (active) {
          setActionError(error.message);
        }
      }
    }

    loadSavedJobs();

    return () => {
      active = false;
    };
  }, []);

  // Load real listings
  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);
      setBrowseError("");

      try {
        const response = await fetch(
          `/jobs/live?search=${encodeURIComponent(searchTerm)}&limit=200`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load real jobs");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setJobs(data);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setBrowseError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => controller.abort();
  }, [searchTerm]);

  // Reset filters when changing searches
  const resetFilters = () => {
    setExperienceFilter("student");
    setCategory("all");
    setJobType("all");
    setLocation("");
    setSourceFilter("all");
    setPage(1);
  };

  // Normal job search
  const handleSearch = event => {
    event.preventDefault();

    setSearchTerm(searchInput.trim());
    setView("browse");
    setSortBy("newest");
    resetFilters();
  };

  // TF-IDF skill matching
  const handleMatch = async event => {
    event.preventDefault();

    if (!skillInput.trim()) {
      setMatchError("Please enter at least one skill.");
      return;
    }

    setMatching(true);
    setMatchError("");
    setMatchedJobs([]);
    setView("matched");
    setSortBy("relevance");
    resetFilters();

    try {
      const response = await fetch(
        `/recommendations/live?skills=${encodeURIComponent(skillInput)}&limit=30`
      );

      if (!response.ok) {
        throw new Error("Unable to find job matches");
      }

      const data = await response.json();
      setMatchedJobs(data);
    } catch (error) {
      setMatchError(error.message);
    } finally {
      setMatching(false);
    }
  };

  // Save or unsave real jobs
  const toggleSave = async job => {
    const id = String(job.id);
    const isSaved = savedIds.includes(id);

    setBusyId(id);
    setActionError("");

    try {
      const response = await fetch(
        isSaved
          ? `/live/saved_jobs/${encodeURIComponent(id)}`
          : "/live/saved_jobs",
        isSaved
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
        let message = "Unable to update saved job";

        try {
          const data = await response.json();
          message = data.detail || message;
        } catch {
          // Keep the default message
        }

        throw new Error(message);
      }

      setSavedIds(current =>
        isSaved
          ? current.filter(savedId => savedId !== id)
          : [...new Set([...current, id])]
      );
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const switchToBrowse = () => {
    setView("browse");
    setSortBy("newest");
    setMatchError("");
    resetFilters();
  };

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  // Select normal or matched jobs
  const sourceJobs =
    view === "matched" ? matchedJobs : jobs;

  // Build available filter choices
  const categories = [
    ...new Set(
      sourceJobs
        .map(job => job.category)
        .filter(Boolean)
    )
  ].sort();

  const jobTypes = [
    ...new Set(
      sourceJobs
        .map(job => String(job.job_type || ""))
        .filter(Boolean)
    )
  ].sort();

  const jobSources = [
    ...new Set(
      sourceJobs
        .map(job => job.source)
        .filter(Boolean)
    )
  ].sort();

  // Filter all results
  const filteredJobs = sourceJobs.filter(job => {
    const level = getExperienceLevel(job);

    const matchesExperience =
      experienceFilter === "all" ||
      (
        experienceFilter === "student" &&
        (level === "early" || level === "possible")
      ) ||
      (
        experienceFilter === "early" &&
        level === "early"
      ) ||
      (
        experienceFilter === "experienced" &&
        level === "experienced"
      );

    const matchesCategory =
      category === "all" ||
      job.category === category;

    const matchesType =
      jobType === "all" ||
      String(job.job_type || "") === jobType;

    const locationText = String(
      job.location || ""
    ).toLowerCase();

    const locationQuery = location.trim().toLowerCase();

    const usSearch = [
      "us",
      "usa",
      "united states"
    ].includes(locationQuery);

    const matchesLocation =
      !locationQuery ||
      locationText.includes(locationQuery) ||
      (
        usSearch &&
        locationText.includes("worldwide")
      );

    const matchesSource =
      sourceFilter === "all" ||
      job.source === sourceFilter;

    return (
      matchesExperience &&
      matchesCategory &&
      matchesType &&
      matchesLocation &&
      matchesSource
    );
  });

  // Sort results
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "title") {
      return String(a.title || "").localeCompare(
        String(b.title || "")
      );
    }

    if (sortBy === "company") {
      return String(a.company || "").localeCompare(
        String(b.company || "")
      );
    }

    if (sortBy === "newest") {
      const aDate = Date.parse(a.published || "") || 0;
      const bDate = Date.parse(b.published || "") || 0;

      return bDate - aDate;
    }

    if (sortBy === "relevance") {
      return (b.match_score || 0) - (a.match_score || 0);
    }

    return 0;
  });

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(sortedJobs.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleJobs = sortedJobs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const isLoading =
    view === "matched" ? matching : loading;

  const currentError =
    view === "matched" ? matchError : browseError;

  return (
    <section>
      <h2 className="text-xl font-bold">
        Real Job Opportunities
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Explore real remote jobs open to US applicants,
        including worldwide opportunities.
      </p>

      {/* Keyword search */}
      <form
        onSubmit={handleSearch}
        className="mt-5 flex flex-wrap gap-3"
      >
        <input
          type="search"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search job titles, companies or keywords..."
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3"
        />

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white"
        >
          Search Jobs
        </button>
      </form>

      {/* Skill matching */}
      <form
        onSubmit={handleMatch}
        className="mt-6 rounded-xl border border-gray-200 bg-white p-5"
      >
        <h3 className="text-lg font-bold">
          Match My Skills
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Enter skills separated by commas.
        </p>

        <input
          type="text"
          value={skillInput}
          onChange={e => setSkillInput(e.target.value)}
          placeholder="Python, SQL, React, Docker"
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={matching}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
          >
            {matching
              ? "Finding Matches..."
              : "Find My Matches"}
          </button>

          <button
            type="button"
            onClick={switchToBrowse}
            className="rounded-lg border border-gray-300 px-5 py-3"
          >
            View All Real Jobs
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold">
          Filter & Sort Jobs
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Experience level */}
          <label className="text-sm">
            Experience Level

            <select
              value={experienceFilter}
              onChange={e =>
                changeFilter(
                  setExperienceFilter,
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="student">
                Student-friendly (entry-level or limited experience)
              </option>

              <option value="early">
                Explicit Internships & Entry-level Jobs
              </option>

              <option value="all">
                All Experience Levels
              </option>

              <option value="experienced">
                Senior & Experienced Roles
              </option>
            </select>
          </label>

          {/* Source */}
          <label className="text-sm">
            Job Source

            <select
              value={sourceFilter}
              onChange={e =>
                changeFilter(
                  setSourceFilter,
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="all">All Sources</option>

              {jobSources.map(source => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          {/* Category */}
          <label className="text-sm">
            Category

            <select
              value={category}
              onChange={e =>
                changeFilter(
                  setCategory,
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="all">All Categories</option>

              {categories.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {/* Employment type */}
          <label className="text-sm">
            Employment Type

            <select
              value={jobType}
              onChange={e =>
                changeFilter(
                  setJobType,
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="all">All Types</option>

              {jobTypes.map(item => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          {/* Location */}
          <label className="text-sm">
            Location Eligibility

            <input
              type="search"
              value={location}
              onChange={e =>
                changeFilter(
                  setLocation,
                  e.target.value
                )
              }
              placeholder="USA, United States, Worldwide..."
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            />
          </label>

          {/* Sort */}
          <label className="text-sm">
            Sort By

            <select
              value={sortBy}
              onChange={e =>
                changeFilter(
                  setSortBy,
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 p-3"
            >
              {view === "matched" && (
                <option value="relevance">
                  Best Match
                </option>
              )}

              <option value="newest">
                Newest First
              </option>

              <option value="title">
                Job Title A-Z
              </option>

              <option value="company">
                Company A-Z
              </option>
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Student-friendly classifications are estimates.
          Jobs with unknown requirements are excluded by default.
          Always verify eligibility on the original posting.
        </p>
      </div>

      {/* Errors */}
      {actionError && (
        <p role="alert" className="mt-5 text-red-600">
          {actionError}
        </p>
      )}

      {currentError && (
        <p role="alert" className="mt-5 text-red-600">
          {currentError}
        </p>
      )}

      {/* Results */}
      {isLoading ? (
        <p className="mt-6 text-gray-500">
          Loading jobs...
        </p>
      ) : (
        <>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">
              {view === "matched"
                ? "Recommended Jobs"
                : "Real Jobs"}
              {" "}({sortedJobs.length})
            </h3>

            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
          </div>

          {view === "matched" && (
            <p className="mt-2 text-sm text-gray-500">
              Recommendations use TF-IDF similarity,
              not your probability of being hired.
            </p>
          )}

          {sortedJobs.length === 0 && (
            <p className="mt-5 text-gray-500">
              No jobs match these filters. Try All Experience
              Levels or a different search.
            </p>
          )}

          <div className="mt-4 space-y-4">
            {visibleJobs.map(job => {
              const id = String(job.id);
              const isSaved = savedIds.includes(id);
              const isBusy = busyId === id;
              const level = getExperienceLevel(job);

              const sourceUrl =
                job.source === "Himalayas"
                  ? "https://himalayas.app"
                  : "https://remotive.com";

              const seniority = Array.isArray(job.seniority)
                ? job.seniority.join(", ")
                : job.seniority || "";

              const levelLabels = {
                early: "Entry-level",
                possible: "Possible early-career",
                experienced: "Experienced",
                unknown: "Not classified"
              };

              return (
                <article
                  key={id}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  {/* Title and match score */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">
                        {job.title}
                      </h3>

                      <p className="mt-1 text-gray-600">
                        {job.company}
                      </p>

                      <span className="mt-2 inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {levelLabels[level]}
                      </span>
                    </div>

                    {view === "matched" &&
                      job.match_score !== undefined && (
                        <div className="rounded-lg bg-blue-50 px-4 py-2 text-center">
                          <p className="text-xs text-blue-700">
                            Similarity
                          </p>

                          <p className="text-xl font-bold text-blue-700">
                            {Math.round(
                              job.match_score * 100
                            )}%
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Job information */}
                  <p className="mt-3 text-sm text-gray-500">
                    Location eligibility: {job.location}
                  </p>

                  {job.category && (
                    <p className="mt-1 text-sm text-gray-500">
                      Category: {job.category}
                    </p>
                  )}

                  {job.job_type && (
                    <p className="mt-1 text-sm text-gray-500">
                      Type: {String(job.job_type).replaceAll("_", " ")}
                    </p>
                  )}

                  {/* Requirements */}
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-sm font-semibold">
                      Requirements at a Glance
                    </h4>

                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">
                          Education:
                        </span>{" "}
                        {job.education || "N/A"}
                      </p>

                      <p>
                        <span className="font-medium">
                          Work Experience:
                        </span>{" "}
                        {job.work_experience || "N/A"}
                      </p>

                      <p>
                        <span className="font-medium">
                          Seniority:
                        </span>{" "}
                        {seniority || "N/A"}
                      </p>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                      Automatically extracted. N/A means not
                      identified in the posting. These results
                      may be incomplete or inaccurate.
                    </p>
                  </div>

                  {/* Salary */}
                  {job.salary && (
                    <p className="mt-4 font-semibold text-green-700">
                      {job.salary}
                    </p>
                  )}

                  {/* Browse skills */}
                  {view === "browse" &&
                    job.skills?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold">
                          Skills Mentioned
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.skills.map(skill => (
                            <span
                              key={skill}
                              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Matched skills */}
                  {view === "matched" &&
                    job.matched_skills?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-green-700">
                          Matching Skills
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.matched_skills.map(skill => (
                            <span
                              key={skill}
                              className="rounded-md bg-green-50 px-3 py-1 text-xs text-green-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Other skills */}
                  {view === "matched" &&
                    job.other_skills_mentioned?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold">
                          Other Skills Mentioned
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          These may be worth learning.
                          They are not necessarily requirements.
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.other_skills_mentioned.map(skill => (
                            <span
                              key={skill}
                              className="rounded-md bg-amber-50 px-3 py-1 text-xs text-amber-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSave(job)}
                      disabled={isBusy || !job.url}
                      className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 disabled:opacity-50"
                    >
                      {isBusy
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

                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 underline"
                    >
                      Source: {job.source || "Remotive"}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {sortedJobs.length > PAGE_SIZE && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}