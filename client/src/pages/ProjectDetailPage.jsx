import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Bug, ExternalLink, GitBranch, Plus, UsersRound } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import BugForm from "../components/BugForm";
import ProjectMembersModal from "../components/ProjectMembersModal";
import { BugRow, EmptyState, ErrorBanner, Loading, PageHeading } from "../components/Shared";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const load = useCallback(async () => {
    try {
      const [projectResponse, bugResponse] = await Promise.all([
        api.get(`/projects/${id}`), api.get("/bugs", { params: { projectId: id, limit: 50 } }),
      ]);
      setProject(projectResponse.data);
      setBugs(bugResponse.data.items);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  if (!project && !error) return <Loading label="Opening project" />;

  return (
    <>
      <Link to="/projects" className="back-link"><ArrowLeft size={15} /> All projects</Link>
      <ErrorBanner message={error} />
      {project && <>
        <PageHeading eyebrow="PROJECT / INVESTIGATION SPACE" title={project.name} description={project.description || "Collect the history behind every bug in this codebase."} action={<div className="heading-actions">{project.owner?._id === user?.id && <button className="button button-outline" onClick={() => setShowMembers(true)}><UsersRound size={15} /> Members</button>}<button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Report a bug</button></div>} />
        <section className="project-detail-meta">
          <span><GitBranch size={15} /> {project.bugCount || bugs.length} investigations</span>
          {project.technologies?.map((technology) => <span className="meta-chip" key={technology}>{technology}</span>)}
          {project.repositoryUrl && <a className="meta-chip repo-link" href={project.repositoryUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Repository</a>}
        </section>
        <article className="panel project-bugs-panel">
          <div className="panel-heading"><div><div className="panel-label"><span className="label-mark" /> PROJECT HISTORY</div><h2>Investigations <span className="heading-count">{bugs.length}</span></h2></div><Link to={`/bugs?projectId=${id}`} className="text-link">Open bug tracker <ArrowUpRight size={14} /></Link></div>
          {bugs.length ? <div className="bug-list-compact">{bugs.map((bug) => <BugRow bug={bug} key={bug._id} />)}</div> : <EmptyState icon={Bug} title="Nothing to rewind yet" description="When something breaks, start its investigation here." action={<button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Report your first bug</button>} />}
        </article>
        {showForm && <BugForm initialProjectId={id} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />}
        {showMembers && <ProjectMembersModal project={project} onClose={() => setShowMembers(false)} onSaved={() => { setShowMembers(false); load(); }} />}
      </>}
    </>
  );
}
