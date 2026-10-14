import JobList from "../components/jobs/JobList";

export default function Search() {
  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">Find jobs</h1>
      <p className="mt-2 text-muted">Internships and entry-level roles for students and recent grads.</p>
      <div className="mt-8">
        <JobList />
      </div>
    </section>
  );
}
