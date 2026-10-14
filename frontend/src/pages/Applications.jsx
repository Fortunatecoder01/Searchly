import { Link } from "react-router-dom";

export default function Applications() {
  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">My applications</h1>
      <p className="mt-2 text-muted">Track every role you've saved or applied to in one place.</p>

      <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <p className="font-semibold">No applications yet</p>
        <p className="mt-1 text-muted">Roles you save from search will show up here.</p>
        <Link
          to="/search"
          className="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          Find jobs
        </Link>
      </div>
    </section>
  );
}
