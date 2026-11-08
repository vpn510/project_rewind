import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import { Avatar, EmptyState, ErrorBanner, EventIcon, formatDate, Loading, PageHeading } from "../components/Shared";

export default function ActivityPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/projects")
      .then(async (projectResponse) => {
        const responses = await Promise.all(projectResponse.data.map((project) => api.get(`/projects/${project._id}/analytics`)));
        const all = responses.flatMap((response) => response.data.recentEvents || []);
        const seen = new Set();
        setEvents(all.filter((event) => {
          if (!event?._id || seen.has(event._id)) return false;
          seen.add(event._id);
          return true;
        }).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)));
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);
  return <>
    <PageHeading eyebrow="A RUNNING HISTORY OF THE WORK" title="Activity" description="A chronological trail of changes, evidence, and decisions across your projects." />
    <ErrorBanner message={error} />
    <article className="panel activity-page-panel">
      <div className="panel-heading"><div><div className="panel-label"><span className="label-mark blue-mark" /> TEAM TIMELINE</div><h2>Latest activity <span className="heading-count">{events.length}</span></h2></div><span className="panel-select"><Clock3 size={13} /> Most recent</span></div>
      {loading ? <Loading label="Gathering the timeline" /> : events.length ? <div className="activity-page-list">{events.map((event) => <Link to={`/bugs/${event.bugId?._id}`} className="activity-page-row" key={event._id}>
        <EventIcon type={event.eventType} />
        <Avatar name={event.userId?.name || "Developer"} size="sm" />
        <span className="activity-page-copy"><strong>{event.userId?.name || "A developer"} <i>{event.title.toLowerCase()}</i></strong><small>{event.description || event.bugId?.title || "Investigation event"}</small></span>
        <time>{formatDate(event.occurredAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
        <ArrowUpRight size={14} className="activity-arrow" />
      </Link>)}</div> : <EmptyState icon={Activity} title="The story starts with an event" description="As your team logs changes and evidence, the full chronology will take shape here." />}
    </article>
  </>;
}
