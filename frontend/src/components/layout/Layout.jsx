import { NavLink, Outlet } from "react-router-dom";
import logo from "../../assets/logo.svg";

const links = [
  { to: "/search", label: "Find jobs" },
  { to: "/agent", label: "Search agent" },
  { to: "/applications", label: "My applications" },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-line">
        <nav className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:h-16 sm:py-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <NavLink to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
            <img src={logo} alt="" className="h-7 w-7" />
            Searchly
          </NavLink>

          <ul className="flex items-center gap-1 text-sm -mx-3 sm:mx-0">
            {links.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `block whitespace-nowrap rounded-md px-3 py-2 font-medium transition-colors ${
                      isActive ? "bg-brand/10 text-brand" : "text-muted hover:text-ink"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-muted">
        Searchly, COSC 490 senior project at Morgan State University
      </footer>
    </div>
  );
}
