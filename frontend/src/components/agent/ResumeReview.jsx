import { useEffect, useState } from "react";
import ResumeBuilder from "./ResumeBuilder";
import {
  loadSavedResume,
  removeSavedResume,
  saveSavedResume,
} from "../../services/savedResume";

const TABS = [
  { id: "extract", label: "Extract Skills" },
  { id: "optimize", label: "Optimize Resume" },
  { id: "build", label: "Build Resume" },
];

function EvidenceSection({ title, items, empty }) {
  return (
    <section className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {!items?.length ? (
        <p className="mt-3 text-sm text-gray-500">{empty || "Nothing found."}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div key={`${item.name || item.label}-${index}`} className="rounded-lg bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{item.name || item.label}</p>
              <p className="mt-2 text-sm text-gray-600">
                <strong>Resume evidence:</strong> {item.evidence}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TextList({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-gray-700">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </section>
  );
}

export default function ResumeReview() {
  const [resume, setResume] = useState(null);
  const [fileInputVersion, setFileInputVersion] = useState(0);
  const [jobDescription, setJobDescription] = useState("");
  const [tab, setTab] = useState("extract");
  const [loading, setLoading] = useState("");
  const [result, setResult] = useState(null);
  const [savedName, setSavedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadSavedResume().then(entry => {
      if (!active || !entry) return;
      setResume(entry.file);
      setSavedName(entry.filename);
      setResult(entry.analysis || null);
      setStatus("Your saved resume was restored from this browser.");
    }).catch(() => {
      // Saving is optional; the analyzer works without browser storage.
    });
    return () => { active = false; };
  }, []);

  function handleUpload(file) {
    setResume(file || null);
    setResult(null);
    setSavedName("");
    setError("");
    setStatus(file ? "Upload selected. Save it below if you want to reuse it later." : "");
  }

  async function saveCurrent() {
    if (!resume) return;
    setSaving(true);
    setError("");
    try {
      await saveSavedResume(resume, result);
      setSavedName(resume.name);
      setStatus("Resume saved in this browser. Search Agent can now reuse it.");
    } catch (err) {
      setError(err.message || "Could not save the resume.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCurrent() {
    setSaving(true);
    setError("");
    try {
      await removeSavedResume();
      setSavedName("");
      setResume(null);
      setResult(null);
      setFileInputVersion(version => version + 1);
      setStatus("Saved resume removed from this browser.");
    } catch (err) {
      setError(err.message || "Could not remove the saved resume.");
    } finally {
      setSaving(false);
    }
  }

  async function analyze(mode) {
    setError("");
    setResult(null);
    if (!resume) {
      setError("Upload or restore a resume first.");
      return;
    }
    if (resume.size > 5 * 1024 * 1024) {
      setError("Maximum file size is 5 MB.");
      return;
    }

    const form = new FormData();
    form.append("resume", resume);
    form.append("mode", mode);
    form.append("job_description", mode === "optimize" ? jobDescription : "");
    setLoading(mode);

    try {
      const response = await fetch("/api/resume/ai-review", {
        method: "POST", body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.detail === "string"
          ? data.detail : `AI analysis failed (${response.status}).`);
      }
      setResult(data);
      // Keep an already-saved resume's new AI analysis up to date.
      if (savedName === resume.name) {
        try {
          await saveSavedResume(resume, data);
        } catch {
          setStatus("Analysis worked, but its saved copy could not be updated.");
        }
      }
    } catch (err) {
      setError(err.message || "AI analysis is unavailable.");
    } finally {
      setLoading("");
    }
  }

  const showAnalysis = result && tab === result.mode;

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-2xl font-bold text-gray-900">AI Resume Studio</h2>
      <p className="mt-2 text-sm text-gray-600">
        Upload once, extract skills, improve your resume, or create a tailored Word resume.
      </p>

      <div className="mt-6">
        <label htmlFor="resume-upload" className="block font-semibold">Upload Resume</label>
        <input
          key={fileInputVersion}
          id="resume-upload"
          type="file"
          accept=".pdf,.docx"
          onChange={event => handleUpload(event.target.files?.[0])}
          className="mt-2 block w-full rounded-lg border border-gray-300 p-3 text-sm"
        />
        {resume && <p className="mt-2 text-sm text-gray-600">Using: <strong>{resume.name}</strong></p>}
        <p className="mt-1 text-xs text-gray-500">PDF or DOCX, maximum 5 MB.</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button" onClick={saveCurrent}
            disabled={!resume || saving || Boolean(loading)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >{saving ? "Saving..." : "Save Resume for Search Agent"}</button>
          {savedName && (
            <button
              type="button" onClick={removeCurrent} disabled={saving || Boolean(loading)}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
            >Remove Saved Resume</button>
          )}
        </div>
        {status && <p className="mt-2 text-sm text-gray-600" role="status">{status}</p>}
        <p className="mt-2 text-xs text-gray-500">
          Before login is implemented, saved resumes stay in this browser's IndexedDB,
          not a private Searchly account. Avoid saving sensitive resumes on shared devices.
          AI analysis sends resume text to Groq after basic contact redaction.
        </p>
      </div>

      <div role="tablist" aria-label="Resume tools" className="mt-7 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => { setTab(item.id); setError(""); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === item.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >{item.label}</button>
        ))}
      </div>

      {tab === "optimize" && (
        <div className="mt-6">
          <label htmlFor="job-description" className="block font-semibold">Job Description (Optional)</label>
          <textarea
            id="job-description" rows={6} maxLength={4500}
            value={jobDescription}
            onChange={event => { setJobDescription(event.target.value); setResult(null); }}
            placeholder="Paste a real job description to compare your resume against its requirements..."
            className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm"
          />
        </div>
      )}

      {tab !== "build" && (
        <button
          type="button" disabled={!resume || Boolean(loading)}
          onClick={() => analyze(tab)}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-50"
        >{loading ? "Analyzing..." : tab === "extract" ? "Extract Skills with AI" : "Optimize My Resume"}</button>
      )}

      <div className={tab === "build" ? "block" : "hidden"}>
        <ResumeBuilder resume={resume} jobDescription={jobDescription} />
      </div>
      {error && <p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}

      {showAnalysis && (
        <div className="mt-8 space-y-5">
          <section className="rounded-xl bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">AI Analysis Completed</p>
            <h3 className="mt-2 text-xl font-bold">{result.filename}</h3>
            <p className="mt-4 text-sm text-gray-700">{result.profile_summary}</p>
          </section>

          <EvidenceSection title="Technical Skills" items={result.technical_skills}
            empty="No technical skills are demonstrated by the resume text." />
          <EvidenceSection title="Transferable Skills" items={result.transferable_skills}
            empty="No transferable skills could be confidently identified." />
          <EvidenceSection title="Education & Training" items={result.education}
            empty="No education information was detected." />
          <EvidenceSection title="Academic Achievements & Activities" items={result.achievements}
            empty="No achievements were detected." />
          <TextList title="Resume Strengths" items={result.strengths} />

          {tab === "optimize" && (
            <>
              {result.job_fit_summary && (
                <section className="rounded-xl border border-gray-200 p-5">
                  <h3 className="text-lg font-bold">Resume Assessment</h3>
                  <p className="mt-3 text-sm text-gray-700">{result.job_fit_summary}</p>
                </section>
              )}
              <TextList title="Matching Job Requirements" items={result.matching_requirements} />
              <TextList title="Qualifications to Review" items={result.qualifications_to_review} />
              <section className="rounded-xl border border-gray-200 p-5">
                <h3 className="text-lg font-bold">Resume Improvement Suggestions</h3>
                {!result.improvements?.length ? (
                  <p className="mt-3 text-sm text-gray-500">No specific improvements were returned.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {result.improvements.map((item, index) => (
                      <div key={index} className="rounded-lg bg-gray-50 p-4">
                        <h4 className="font-semibold">{item.section}</h4>
                        {item.original_evidence && (
                          <p className="mt-3 text-sm text-gray-700">
                            <strong>Original:</strong> {item.original_evidence}
                          </p>
                        )}
                        <p className="mt-3 text-sm text-gray-700"><strong>Suggestion:</strong> {item.suggestion}</p>
                        {item.example_rewrite && (
                          <p className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-800">
                            <strong>Example rewrite:</strong> {item.example_rewrite}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          <p className="text-xs text-gray-500">{result.note}</p>
        </div>
      )}
    </section>
  );
}
