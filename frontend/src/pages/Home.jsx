import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/input";

const quickSearches = ["Software", "Data", "Cybersecurity", "Cloud", "IT Support"];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function goToSearch(term) {
    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
  }

  return (
    <section className="py-8 sm:py-16 max-w-3xl">
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
        Find the internship that fits your major.
      </h1>
      <p className="mt-5 text-lg text-muted max-w-xl">
        Search entry-level roles, keep track of where you applied, and let the Searchly agent
        surface new leads for you.
      </p>

      <form
        onSubmit={e => {
          e.preventDefault();
          goToSearch(query);
        }}
        className="mt-10 flex flex-col sm:flex-row gap-3 rounded-2xl bg-white p-3 border border-line shadow-[0_8px_30px_-12px_rgba(20,33,61,0.25)]"
      >
        <label htmlFor="home-search" className="sr-only">Job title</label>
        <Input
          id="home-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Try “Python”, “Data Analyst”, or “Cloud”"
          className="border-transparent text-lg"
        />
        <Button type="submit" className="sm:px-8">Search jobs</Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted mr-1">Popular:</span>
        {quickSearches.map(term => (
          <button
            key={term}
            onClick={() => goToSearch(term)}
            className="rounded-full border border-line bg-white px-3 py-1 font-medium hover:border-brand hover:text-brand transition-colors"
          >
            {term}
          </button>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted">
        Already applying? <Link to="/applications" className="text-brand font-semibold hover:underline">Open your applications</Link>
      </p>
    </section>
  );
}
