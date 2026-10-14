import { useState,useEffect } from "react";
import { saveJob } from "../../services/api";
export default function JobCard({ job }) {
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    async function checkIfSaved() {
      try {
        const response = await fetch("/saved_jobs");
        if (!response.ok) {
          throw new Error("Failed to fetch saved jobs");
        }
        const savedjobs = await response.json();
        const alreadySaved = savedjobs.some(savedJob => savedJob.id === job.id);
        setIsSaved(alreadySaved);
      } catch (error) {
        console.error("Error checking saved job:", error);
      }
    }

    checkIfSaved();
  }, [job.id]);

  const initials = job.company
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2);

  const handleSaveJob = async () => {
    try {
      await saveJob(job.id);
      setIsSaved(true);
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  return (
    <article className="flex items-start gap-4 p-5 hover:bg-canvas transition-colors">
      <div
        aria-hidden="true"
        className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-lg bg-ink text-sm font-bold text-white"
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold leading-snug">{job.title}</h3>
        <p className="text-muted">
          {job.company}, {job.location}
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.map(skill => (
            <li key={skill} className="rounded-md bg-canvas border border-line px-2 py-0.5 text-xs font-medium">
              {skill}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={handleSaveJob}
          disabled={isSaved}
          className={`mt-3 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors ${
            isSaved ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isSaved ? "Saved" : "Save Job"}
        </button>
      </div>

    </article>
  );
}
