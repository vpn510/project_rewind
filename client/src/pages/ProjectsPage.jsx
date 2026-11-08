import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, FolderKanban, GitBranch, Plus, Search, Sparkles } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import ProjectForm from "../components/ProjectForm";
import { Avatar, EmptyState, ErrorBanner, Loading, PageHeading } from "../components/Shared";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const showForm = searchParams.get("new") === "1";
  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  function closeForm() { searchParams.delete("new"); setSearchParams(searchParams, { replace: true }); }

  const filtered = projects.filter((project) => `${project.name} ${project.description} ${project.technologies?.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeading eyebrow="YOUR TEAM'S CODEBASES" title="Projects" description="Every project has a history. Keep its investigations in one place." action={<button className="button button-primary" onClick={() => setSearchParams({ new: "1" })}><Plus size={16} /> New project</button>} />
      <ErrorBanner message={error} />
      <section className="projects-toolbar">
        <div className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a project…" /></div>
        <span className="toolbar-result-count">{filtered.length} {filtered.length === 1 ? "project" : "projects"}</span>
      </section>
      {loading ? <Loading label="Loading projects" /> : filtered.length ? <section className="projects-grid">
        {filtered.map((project, index) => <Link className="project-card" to={`/projects/${project._id}`} key={project._id}>
          <div className={`project-card-art art-${index % 4}`}><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><span className="art-icon"><FolderKanban size={20} /></span><span className="art-index">PROJECT / {String(index + 1).padStart(2, "0")}</span></div>
          <div className="project-card-body">
            <div className="project-card-title"><h2>{project.name}</h2><ArrowUpRight size={16} /></div>
            <p>{project.description || "A place for your team to collect the evidence and understand the why."}</p>
            <div className="tech-tags">{project.technologies?.length ? project.technologies.slice(0, 4).map((tech) => <span key={tech}>{tech}</span>) : <span>Investigation workspace</span>}</div>
            <div className="project-card-bottom"><span className="project-card-bugs"><GitBranch size={14} /> <strong>{project.bugCount || 0}</strong> investigations</span><span className="project-avatars">{(project.members || []).slice(0, 3).map((member) => <Avatar key={member._id} name={member.name} size="xs" />)}</span></div>
          </div>
        </Link>)}
      </section> : <EmptyState icon={search ? Search : FolderKanban} title={search ? "No project matches" : "A workspace starts here"} description={search ? "Try another name or technology." : "Create a project to bring bugs, commits, logs, and teammates together."} action={!search && <button className="button button-primary" onClick={() => setSearchParams({ new: "1" })}><Plus size={15} /> Create your first project</button>} />}
      <div className="projects-footnote"><Sparkles size={14} /><span>Organize your codebases. <strong>Make every bug easier to understand.</strong></span></div>
      {showForm && <ProjectForm onClose={closeForm} onCreated={() => { closeForm(); load(); }} />}
    </>
  );
}
