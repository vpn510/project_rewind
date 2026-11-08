import { Link } from "react-router-dom";
import { ArrowUpRight, CircleDot, GitCommitHorizontal, MessageSquareText, Terminal } from "lucide-react";

export function Avatar({ name = "Developer", size = "md" }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`avatar avatar-${size}`}>{initials}</span>;
}

export function Severity({ value = "medium" }) {
  return <span className={`severity severity-${value}`}>{value}</span>;
}

export function Status({ value = "open" }) {
  return <span className={`status status-${value}`}>{value?.replace("-", " ")}</span>;
}

export function EmptyState({ icon: Icon = CircleDot, title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={20} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Loading({ label = "Loading workspace" }) {
  return <div className="loading"><span className="spinner" />{label}</div>;
}

export function ErrorBanner({ message }) {
  return message ? <div className="error-banner" role="alert">{message}</div> : null;
}

export function EventIcon({ type }) {
  const Icon = type === "commit_added" ? GitCommitHorizontal : type === "error_logged" ? Terminal : type === "note_added" ? MessageSquareText : CircleDot;
  return <span className={`event-icon event-${type}`}><Icon size={15} /></span>;
}

export function BugRow({ bug }) {
  return (
    <Link className="bug-row" to={`/bugs/${bug._id}`}>
      <span className={`bug-indicator indicator-${bug.severity}`} />
      <div className="bug-row-title">
        <strong>{bug.title}</strong>
        <span>{bug.projectId?.name || "Project"} <span className="dot-separator">·</span> {bug.affectedFile || "No file linked"}</span>
      </div>
      <Severity value={bug.severity} />
      <Status value={bug.status} />
      {bug.assignedTo ? <Avatar name={bug.assignedTo.name} size="sm" /> : <span className="unassigned">—</span>}
      <ArrowUpRight className="row-arrow" size={16} />
    </Link>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function formatDate(date, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!date) return "—";
  return new Intl.DateTimeFormat(undefined, options).format(new Date(date));
}
