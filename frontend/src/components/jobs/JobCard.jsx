export default function JobCard({ job }) {
  return (
    <div className="border p-4 rounded mb-3">
      <h3 className="font-bold">{job.title}</h3>
      <p>{job.company}</p>
      <a href={job.url} className="text-blue-600 underline">
        View Job
      </a>
    </div>
  );
}