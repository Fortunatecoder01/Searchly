import JobList from "../components/jobs/JobList";

export default function Search() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Search Jobs</h2>
      <JobList />
    </div>
  );
}