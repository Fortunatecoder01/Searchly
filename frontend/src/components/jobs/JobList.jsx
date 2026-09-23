import JobCard from "./JobCard";

const mockJobs = [
  { title: "Frontend Developer", company: "MockCorp", url: "#" },
  { title: "React Engineer", company: "Techify", url: "#" },
];

export default function JobList() {
  return (
    <div>
      {mockJobs.map((job, i) => (
        <JobCard key={i} job={job} />
      ))}
    </div>
  );
}