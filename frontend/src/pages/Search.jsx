
import LiveJobs from "../components/jobs/LiveJobs";

export default function Search() {
  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Find Jobs
      </h1>

      <p className="mt-2 text-muted">
        Search real job opportunities, compare skills,
        and discover jobs that match your experience.
      </p>

      <div className="mt-8">
        <LiveJobs />
      </div>
    </section>
  );
}
