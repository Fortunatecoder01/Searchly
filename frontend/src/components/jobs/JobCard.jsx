export default function JobCard({ job }) {
  const initials = job.company
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2);

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
      </div>

    </article>
  );
}
