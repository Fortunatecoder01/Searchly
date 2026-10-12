export default function JobCard({ job }) {
  return (
    <div style={{
      border: "1px solid #ccc",
      padding: "15px",
      marginTop: "15px",
      borderRadius: "8px"
    }}>
      <h3>{job.title}</h3>

      <p>Company: {job.company}</p>
      <p>Location: {job.location}</p>

      <p>
        Skills: {job.skills.join(", ")}
      </p>
    </div>
  );
}