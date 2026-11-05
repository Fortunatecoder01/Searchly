import { useCallback, useEffect, useState } from "react";
import { loadSavedResume, saveSavedResume } from "../../services/savedResume";

function getSkills(analysis) {
  const items = Array.isArray(analysis?.skills) ? analysis.skills : [];
  const names = items.map(item => typeof item === "string" ? item : item.name)
    .filter(Boolean).map(item => String(item).trim());
  return [...new Set(names)].slice(0, 25);
}

export default function ResumeAgentPanel({ onResults }) {
  const [saved, setSaved] = useState(null);
  const [role, setRole] = useState("");
  const [education, setEducation] = useState("not_specified");
  const [years, setYears] = useState(0);
  const [level, setLevel] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const refresh = useCallback(async () => {
    try {
      setSaved(await loadSavedResume());
    } catch {
      setSaved(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("searchly:resume-changed", refresh);
    return () => window.removeEventListener("searchly:resume-changed", refresh);
  }, [refresh]);

  async function searchWithResume() {
    if (!role.trim()) {
      setError("Enter the kind of job you want to find.");
      return;
    }
    if (!saved?.file) {
      setError("Save a resume in Resume Studio first.");
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");

    try {
      let analysis = saved.analysis;
      if (!getSkills(analysis).length) {
        setInfo("Extracting skills from your saved resume...");
        const form = new FormData();
        form.append("resume", saved.file);
        form.append("mode", "extract");
        form.append("job_description", "");
        const response = await fetch("/api/resume/ai-review", {
          method: "POST", body: form,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(typeof data.detail === "string" ? data.detail : "Could not analyze saved resume.");
        }
        analysis = data;
        await saveSavedResume(saved.file, analysis);
        setSaved(current => ({ ...current, analysis }));
      }

      const skills = getSkills(analysis);
      if (!skills.length) {
        throw new Error(
          "No evidence-backed skills were found. Try a more detailed resume or use the regular career form."
        );
      }
      setInfo(`Searching using ${skills.length} AI-extracted skills...`);
      const academicContext = (analysis.education || [])
        .map(item => item.label || "").filter(Boolean).join("; ").slice(0, 120);
      const payload = {
        role: role.trim(),
        major: academicContext,
        skills: skills.join(", ").slice(0, 500),
        education,
        years_experience: Math.max(0, Math.min(40, Number(years) || 0)),
        experience_level: level,
        limit: 10,
      };
      const response = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.detail === "string"
          ? data.detail : `Search Agent failed (${response.status}).`);
      }
      onResults?.(data);
      setInfo(`${data.results?.length || 0} recommendations found. ${data.ai_used ? "AI ranking used." : "TF-IDF fallback used."}`);
    } catch (err) {
      setError(err.message || "Resume-based search failed.");
      setInfo("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-xl font-bold">Search Using My Saved Resume</h2>
      <p className="mt-2 text-sm text-gray-600">
        Searchly uses skills extracted from the resume you saved in this browser.
        You choose the target role and can correct your education or experience level.
      </p>
      {!saved ? (
        <p className="mt-3 text-sm text-amber-800">
          No saved resume. Scroll to AI Resume Studio below, upload a file, and click Save Resume for Search Agent.
        </p>
      ) : (
        <p className="mt-3 text-sm text-gray-700"><strong>Saved resume:</strong> {saved.filename}</p>
      )}
      <button type="button" onClick={refresh} className="mt-2 text-sm text-blue-700 underline">
        Refresh saved resume
      </button>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Target Role
          <input value={role} onChange={event => setRole(event.target.value)}
            placeholder="Example: Junior Data Analyst" maxLength={120}
            className="mt-2 block w-full rounded-lg border border-gray-300 p-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Education Level (verify manually)
          <select value={education} onChange={event => setEducation(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-300 p-3 font-normal">
            <option value="not_specified">Prefer not to specify</option>
            <option value="high_school">High School</option>
            <option value="associate">Associate Degree</option>
            <option value="bachelor">Bachelor's Degree</option>
            <option value="master">Master's Degree</option>
            <option value="doctorate">Doctorate</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Relevant Experience (years)
          <input type="number" min="0" max="40" value={years}
            onChange={event => setYears(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-300 p-3 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          Job Experience Filter
          <select value={level} onChange={event => setLevel(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-gray-300 p-3 font-normal">
            <option value="student">Student / Internship</option>
            <option value="early">Early Career</option>
            <option value="all">All Experience Levels</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        All Experience Levels can include senior jobs. Review qualifications carefully.
        This search uses extracted resume skills, not every sentence in your resume.
      </p>
      <button type="button" onClick={searchWithResume}
        disabled={!saved?.file || loading || !role.trim()}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-50">
        {loading ? "Finding Resume Matches..." : "Find Jobs Using My Resume"}
      </button>
      {info && <p role="status" className="mt-3 text-sm text-gray-600">{info}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
