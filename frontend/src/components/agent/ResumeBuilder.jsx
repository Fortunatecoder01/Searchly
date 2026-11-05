import { useEffect, useState } from "react";

export default function ResumeBuilder({ resume, jobDescription }) {
  const [targetRole, setTargetRole] = useState("");
  const [updates, setUpdates] = useState("");
  const [draft, setDraft] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft("");
    setQuestions([]);
    setError("");
  }, [resume]);

  async function generateDraft() {
    if (!resume || !targetRole.trim()) {
      setError("Upload a resume and enter a target role first.");
      return;
    }

    setLoading(true);
    setError("");
    setDraft("");
    setQuestions([]);

    const form = new FormData();
    form.append("resume", resume);
    form.append("target_role", targetRole);
    form.append("job_description", jobDescription || "");
    form.append("user_updates", updates);

    try {
      const response = await fetch("/api/resume/draft", {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `Resume drafting failed (${response.status}).`
        );
      }
      setDraft(data.resume_text || "");
      setQuestions(data.questions_to_verify || []);
    } catch (err) {
      setError(err.message || "Could not create a resume draft.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadResume() {
    if (!draft.trim()) return;
    setDownloading(true);
    setError("");

    try {
      const response = await fetch("/api/resume/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: draft }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Download failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "searchly-tailored-resume.docx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setError(err.message || "Could not download the resume.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-gray-200 p-5">
      <h3 className="text-xl font-bold text-gray-900">
        Generate a Personalized Resume
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        Create an editable resume draft from your uploaded resume, your
        updates, and the job description above.
      </p>

      <label htmlFor="resume-target-role" className="mt-5 block font-semibold">
        Target Job Title
      </label>
      <input
        id="resume-target-role"
        value={targetRole}
        onChange={(event) => setTargetRole(event.target.value)}
        placeholder="Example: Teaching Assistant"
        maxLength={100}
        className="mt-2 w-full rounded-lg border border-gray-300 p-3"
      />

      <label htmlFor="resume-updates" className="mt-5 block font-semibold">
        New Information Not in Your Resume (Optional)
      </label>
      <textarea
        id="resume-updates"
        rows={5}
        maxLength={2000}
        value={updates}
        onChange={(event) => setUpdates(event.target.value)}
        placeholder="Example: Current education status, newer jobs, projects, skills, or certifications. Only enter facts that are true."
        className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm"
      />

      <button
        type="button"
        onClick={generateDraft}
        disabled={!resume || !targetRole.trim() || loading || downloading}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Creating Resume..." : "Generate Tailored Resume"}
      </button>

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

      {draft && (
        <div className="mt-6 space-y-4">
          <p className="font-semibold">Your Resume Draft (Editable)</p>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={22}
            className="w-full rounded-lg border border-gray-300 p-4 font-mono text-sm"
            aria-label="Editable generated resume"
          />
          {questions.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-4">
              <h4 className="font-semibold">Details to Verify or Add</h4>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                {questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-gray-600">
            Check every claim, date, education detail and bullet before
            applying. AI drafts may omit or misstate information.
          </p>
          <button
            type="button"
            onClick={downloadResume}
            disabled={downloading}
            className="rounded-lg bg-gray-900 px-5 py-3 font-medium text-white disabled:opacity-50"
          >
            {downloading ? "Preparing Document..." : "Download Resume (Word)"}
          </button>
        </div>
      )}
    </section>
  );
}
