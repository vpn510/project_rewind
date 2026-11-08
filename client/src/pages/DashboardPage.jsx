import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, ArrowUpRight, Bug, CircleDot, Clock3, FolderKanban, Plus, Radar, ShieldAlert, Sparkles } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { getErrorMessage } from "../services/api";
import { Avatar, BugRow, EmptyState, ErrorBanner, formatDate, Loading, PageHeading } from "../components/Shared";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [analytics, bugList, projectList] = await Promise.all([
        api.get("/analytics/dashboard"), api.get("/bugs", { params: { limit: 6 } }), api.get("/projects"),
      ]);
      setData(analytics.data);
      setBugs(bugList.data.items);
      setProjects(projectList.data.slice(0, 3));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  useEffect(() => { load(); }, []);
  if (!data && !error) return <Loading />;

  const monthLabels = (data?.monthly || []).map((item) => ({
    month: new Date(`${item._id}-01T00:00:00`).toLocaleDateString(undefined, { month: "short" }),
    bugs: item.count,
  }));
  const chartData = monthLabels.length ? monthLabels : [{ month: "—", bugs: 0 }];
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
  const cards = [
    { label: "Tracked bugs", value: data?.totals.bugs ?? "—", icon: Bug, color: "violet", note: "Across all projects" },
    { label: "Open investigations", value: data?.totals.open ?? "—", icon: CircleDot, color: "blue", note: "Need a closer look" },
    { label: "Critical issues", value: data?.totals.critical ?? "—", icon: ShieldAlert, color: "orange", note: "Unresolved right now" },
    { label: "Active projects", value: data?.totals.projects ?? "—", icon: FolderKanban, color: "mint", note: "Your team's workspace" },
  ];

  return (
    <>
      <PageHeading eyebrow={today} title={<>Good morning, <span className="heading-soft">let’s find the why.</span></>} description="A clear view of what’s happening across your projects." action={<Link className="button button-primary" to="/projects"><Plus size={16} /> New project</Link>} />
      <ErrorBanner message={error} />
      <section className="stat-grid">
        {cards.map(({ label, value, icon: Icon, color, note }, index) => (
          <article className={`stat-card stat-${color}`} key={label}>
            <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={16} /></span></div>
            <div className="stat-value">{value}<span className="stat-mini">{index === 0 && data?.totals.bugs > 0 ? <ArrowUpRight size={13} /> : null}</span></div>
            <div className="stat-note"><i />{note}</div>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel trend-panel">
          <div className="panel-heading"><div><div className="panel-label"><span className="label-mark" /> INVESTIGATION PULSE</div><h2>Bug activity</h2></div><span className="panel-select">Last 6 months <Clock3 size={13} /></span></div>
          <div className="chart-summary"><strong>{data?.totals.bugs ?? 0}</strong><span>reported bugs</span><span className="chart-period"><i /> every month</span></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}>
                <defs><linearGradient id="bugGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b29aff" stopOpacity={0.24} /><stop offset="96%" stopColor="#b29aff" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#292a35" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#777987", fontSize: 11 }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#777987", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1d1e27", border: "1px solid #333440", borderRadius: 10, color: "#f5f2ff", fontSize: 12 }} />
                <Area type="monotone" dataKey="bugs" stroke="#ad90ff" strokeWidth={2} fill="url(#bugGradient)" activeDot={{ r: 4, fill: "#c5b3ff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer"><span><i className="legend-dot" /> Reported bugs</span><span>Activity is grouped by report date</span></div>
        </article>
        <article className="panel project-panel">
          <div className="panel-heading"><div><div className="panel-label"><span className="label-mark mint-mark" /> YOUR WORKSPACES</div><h2>Projects</h2></div><Link to="/projects" className="text-link">View all <ArrowRight size={14} /></Link></div>
          <div className="project-list">
            {projects.map((project, index) => <Link className="project-card-mini" to={`/projects/${project._id}`} key={project._id}>
              <span className={`project-icon project-icon-${index % 4}`}><FolderKanban size={16} /></span>
              <span className="project-mini-copy"><strong>{project.name}</strong><small>{project.technologies?.slice(0, 2).join(" · ") || "Project workspace"}</small></span>
              <span className="project-bug-count">{project.bugCount || 0}<small>bugs</small></span>
            </Link>)}
            {!projects.length && <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to start an investigation." />}
          </div>
          <Link className="add-project-link" to="/projects"><Plus size={14} /> Explore all projects <ArrowUpRight size={13} /></Link>
        </article>
      </section>
      <section className="dashboard-grid lower-grid">
        <article className="panel recent-panel">
          <div className="panel-heading"><div><div className="panel-label"><span className="label-mark orange-mark" /> NEEDS YOUR ATTENTION</div><h2>Recent investigations</h2></div><Link to="/bugs" className="text-link">All bugs <ArrowRight size={14} /></Link></div>
          {bugs.length ? <div className="bug-list-compact">{bugs.map((bug) => <BugRow bug={bug} key={bug._id} />)}</div> : <EmptyState icon={Bug} title="No bugs in the rewind" description="When issues are reported, they’ll show up here." />}
        </article>
        <article className="panel activity-panel">
          <div className="panel-heading"><div><div className="panel-label"><span className="label-mark blue-mark" /> THE LATEST</div><h2>Team activity</h2></div><Link to="/activity" className="text-link">Timeline <ArrowRight size={14} /></Link></div>
          <div className="activity-feed">
            {data?.recentEvents?.slice(0, 5).map((event) => <Link className="activity-item" key={event._id} to={`/bugs/${event.bugId?._id}`}>
              <Avatar name={event.userId?.name || "Developer"} size="sm" />
              <span className="activity-copy"><strong>{event.userId?.name || "A developer"} <i>{event.title.toLowerCase()}</i></strong><small>{event.bugId?.title || "Investigation"} <span>·</span> {formatDate(event.occurredAt, { month: "short", day: "numeric" })}</small></span>
              <ArrowUpRight size={13} className="activity-arrow" />
            </Link>)}
            {!data?.recentEvents?.length && <EmptyState icon={Activity} title="Quiet for now" description="Your investigation activity will appear here." />}
          </div>
          <div className="insight-strip"><span className="insight-spark"><Sparkles size={14} /></span><span><strong>Stay curious.</strong> Every event brings you closer to the why.</span><Radar size={15} className="insight-radar" /></div>
        </article>
      </section>
      <footer className="page-footer"><span>REWIND STUDIO · ENGINEERING WORKSPACE</span><span>FOLLOW THE EVIDENCE <Activity size={12} /></span></footer>
    </>
  );
}
