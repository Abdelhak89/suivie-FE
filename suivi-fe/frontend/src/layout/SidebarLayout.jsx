import { NavLink, Outlet } from "react-router-dom";
import { MENU } from "../config/fePages.js";
import "../styles/layout.css";

const linkClass = ({ isActive }) =>
  "navLink" + (isActive ? " navLinkActive" : "");

export default function SidebarLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">SUIVIE F.E</div>

        <nav className="nav">
          {MENU.map((m) => (
            <NavLink key={m.key} to={m.path} className={linkClass}>
              <span>{m.label}</span>
            </NavLink>
          ))}
        </nav>

        
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
