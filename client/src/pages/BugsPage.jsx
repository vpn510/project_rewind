import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bug, Plus, Search, SlidersHorizontal } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import BugForm from "../components/BugForm";
import { BugRow, EmptyState, ErrorBanner, Loading, PageHeading } from "../components/Shared";

export default function BugsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ status: "", severity: "", projectId: searchParams.get("projectId") || "", search: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get("/projects").then(({ data }) => setProjects(data)).catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/bugs", { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
      setBugs(data.items);
      setTotal(data.total);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  function changeFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    if (key === "projectId") {
      if (value) setSearchParams({ projectId: value }, { replace: true });
      else setSearchParams({}, { replace: true });
    }
  }

  return (
    <>
      <PageHeading eyebrow="THE EVIDENCE, IN ONE PLACE" title="Investigations" description="Track the issue. Trace the events. Get to the root of what happened." action={<button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Report a bug</button>} />
      <ErrorBanner message={error} />
      <section className="bug-toolbar">
        <div className="search-field"><Search size={16} /><input value={filters.search} onChange={(event) => changeFilter("search", event.target.value)} placeholder="Search issues, files, descriptions…" /></div>
        <div className="filter-control"><SlidersHorizontal size={14} /><span>Filter</span></div>
        <select aria-label="Filter by status" value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}><option value="">All statuses</option><option value="open">Open</option><option value="investigating">Investigating</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
        <select aria-label="Filter by severity" value={filters.severity} onChange={(event) => changeFilter("severity", event.target.value)}><option value="">All severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
        <select aria-label="Filter by project" value={filters.projectId} onChange={(event) => changeFilter("projectId", event.target.value)}><option value="">All projects</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select>
        <span className="toolbar-result-count">{total} {total === 1 ? "issue" : "issues"}</span>
      </section>
      <article className="panel bugs-table">
        <div className="bugs-table-head"><span>INVESTIGATION</span><span>SEVERITY</span><span>STATUS</span><span>ASSIGNEE</span><span /></div>
        {loading ? <Loading label="Loading investigations" /> : bugs.length ? <div className="bug-list-compact">{bugs.map((bug) => <BugRow bug={bug} key={bug._id} />)}</div> : <EmptyState icon={filters.search ? Search : Bug} title="No investigations found" description={filters.search || filters.status || filters.severity || filters.projectId ? "Try broadening your filters, or report a new bug." : "Create an investigation to capture the history behind your next bug."} action={<button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Report a bug</button>} />}
      </article>
      <div className="table-footnote">Showing up to 20 of {total} investigations · Sorted by most recently updated</div>
      {showForm && <BugForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />}
    </>
  );
}
