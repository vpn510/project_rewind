import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowUpRight, Bell, Bug, ChevronDown, Command, FolderKanban, LayoutDashboard, LogOut, Plus, Search, Settings2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/Shared";
import BugForm from "../components/BugForm";
import api from "../services/api";

const navigation = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  { label: "Investigations", to: "/bugs", icon: Bug },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Activity", to: "/activity", icon: Activity },
];

export default function WorkspaceLayout() {
  const { user, signOut } = useAuth();
  const [showBugForm, setShowBugForm] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-word">rewind<span className="brand-period">.</span><small>ENGINEERING WORKSPACE</small></span>
        </NavLink>
        <div className="workspace-switcher">
          <span className="workspace-avatar">R</span>
          <span><strong>Rewind Studio</strong><small>Personal workspace</small></span>
          <ChevronDown size={15} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="primary-nav">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {label === "Investigations" && <span className="nav-pip" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-section-heading"><span className="nav-caption">YOUR PROJECTS</span><button aria-label="Create project" onClick={() => navigate("/projects?new=1")}><Plus size={15} /></button></div>
        <ProjectNav />
        <div className="sidebar-bottom">
          <div className="sidebar-callout">
            <span className="callout-glyph"><Command size={16} /></span>
            <strong>Understand the why.</strong>
            <p>Every bug has a story. Follow the evidence back.</p>
            <span className="callout-link">Explore your timeline <ArrowUpRight size={13} /></span>
          </div>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}><Settings2 size={17} /><span>Settings</span></NavLink>
          <button className="profile-button" onClick={signOut}>
            <Avatar name={user?.name} size="sm" />
            <span className="profile-copy"><strong>{user?.name}</strong><small>{user?.email}</small></span>
            <LogOut size={15} className="logout-icon" />
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{pageName(location.pathname)}</strong></div>
          <div className="topbar-actions">
            <button className={`search-trigger ${searchOpen ? "search-trigger-open" : ""}`} onClick={() => setSearchOpen(!searchOpen)}><Search size={15} /><span>Search anything…</span><kbd>⌘ K</kbd></button>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button>
            <button className="button button-primary button-small" onClick={() => setShowBugForm(true)}><Plus size={15} /> New investigation</button>
          </div>
        </header>
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
        <div className="page-content"><Outlet /></div>
      </main>
      {showBugForm && <BugForm onClose={() => setShowBugForm(false)} onCreated={() => { setShowBugForm(false); navigate("/bugs"); }} />}
    </div>
  );
}

function ProjectNav() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    api.get("/projects").then(({ data }) => setProjects(data.slice(0, 5))).catch(() => {});
  }, []);
  return <div className="project-nav">
    {projects.map((project, index) => (
      <NavLink key={project._id} to={`/projects/${project._id}`} className="project-nav-link">
        <span className={`project-dot project-dot-${index % 4}`} />{project.name}
      </NavLink>
    ))}
    {!projects.length && <span className="project-nav-empty">Your projects show up here</span>}
  </div>;
}

function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  async function search(value) {
    setQuery(value);
    if (value.trim().length < 2) return setResults([]);
    api.get("/bugs", { params: { search: value, limit: 6 } }).then(({ data }) => setResults(data.items)).catch(() => setResults([]));
  }
  return <div className="search-overlay">
    <div className="search-overlay-input"><Search size={17} /><input autoFocus value={query} onChange={(event) => search(event.target.value)} placeholder="Search investigations by title or file…" /><kbd>ESC</kbd><button className="icon-button" onClick={onClose}>×</button></div>
    {query.length >= 2 && <div className="search-results">{results.length ? results.map((bug) => <button key={bug._id} onClick={() => { navigate(`/bugs/${bug._id}`); onClose(); }}><Bug size={15} /><span>{bug.title}<small>{bug.projectId?.name}</small></span><ArrowUpRight size={14} /></button>) : <p>No matching investigations.</p>}</div>}
  </div>;
}

function pageName(path) {
  if (path === "/") return "Overview";
  if (path.startsWith("/bugs/")) return "Investigation";
  if (path.startsWith("/projects/")) return "Project";
  if (path.startsWith("/bugs")) return "Investigations";
  if (path.startsWith("/projects")) return "Projects";
  return path.slice(1).replace(/^./, (letter) => letter.toUpperCase());
}
