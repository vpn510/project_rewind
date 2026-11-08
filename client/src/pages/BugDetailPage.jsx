import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUpRight, Check, ChevronDown, Clock3, Code2, FileText, GitCommitHorizontal, Paperclip, Play, Plus, Send, Sparkles, Terminal, Upload, X } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import Modal from "../components/Modal";
import { Avatar, EmptyState, ErrorBanner, EventIcon, formatDate, Loading, Severity, Status } from "../components/Shared";

const eventLabels = { bug_reported: "Bug reported", code_changed: "Code changed", commit_added: "Commit added", error_logged: "Error logged", status_changed: "Status changed", note_added: "Investigation note", bug_fixed: "Bug fixed", cause_confirmed: "Cause confirmed", cause_rejected: "Cause rejected" };

export default function BugDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [tab, setTab] = useState("timeline");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/bugs/${id}`);
      setDetail(data);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function updateStatus(status) {
    try {
      await api.put(`/bugs/${id}`, { status });
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setError("");
    try {
      const { data } = await api.post(`/bugs/${id}/analyze`);
      setAnalysis(data);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setAnalyzing(false);
    }
  }

  async function decideCause(eventId, decision) {
    try {
      const explanation = window.prompt(decision === "confirmed" ? "Why does this look like the cause? (optional)" : "Why is this not the cause? (optional)");
      if (explanation === null) return;
      await api.post(`/bugs/${id}/root-cause-decision`, { eventId, decision, explanation });
      setAnalysis(null);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      await api.post(`/bugs/${id}/comments`, { message: comment });
      setComment("");
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSending(false);
    }
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      await api.post(`/bugs/${id}/attachments`, body);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  }

  async function loadOlderEvents() {
    if (!detail?.timelineMeta?.hasOlder || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const { data } = await api.get(`/bugs/${id}/timeline`, { params: { page: detail.timelineMeta.page + 1 } });
      setDetail((current) => ({ ...current, events: [...data.items, ...current.events], timelineMeta: data }));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingOlder(false);
    }
  }

  if (!detail && !error) return <Loading label="Rewinding the investigation" />;
  const bug = detail?.bug;
  const timeline = detail?.events || [];
  const location = api.defaults.baseURL.replace(/\/api\/?$/, "");

  return <>
    <Link to="/bugs" className="back-link"><ArrowLeft size={15} /> All investigations</Link>
    <ErrorBanner message={error} />
    {bug && <>
      <div className="bug-detail-heading">
        <div className="bug-detail-title-wrap">
          <div className="detail-eyebrow">{bug.projectId?.name || "Project"} <span>/</span> REWIND / {bug._id.slice(-6).toUpperCase()}</div>
          <h1>{bug.title}</h1>
          <div className="bug-detail-meta"><Severity value={bug.severity} /><Status value={bug.status} /><span><Clock3 size={13} /> Reported {formatDate(bug.createdAt)}</span><span>by {bug.reportedBy?.name || "a developer"}</span></div>
        </div>
        <label className="status-select"><span>STATUS</span><select value={bug.status} onChange={(event) => updateStatus(event.target.value)}><option value="open">Open</option><option value="investigating">Investigating</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><ChevronDown size={14} /></label>
      </div>
      <div className="bug-workspace">
        <div className="bug-main-column">
          <div className="bug-tabs"><button className={tab === "timeline" ? "bug-tab-active" : ""} onClick={() => setTab("timeline")}><GitCommitHorizontal size={15} /> Rewind timeline <span>{timeline.length}</span></button><button className={tab === "evidence" ? "bug-tab-active" : ""} onClick={() => setTab("evidence")}><Paperclip size={15} /> Evidence <span>{detail.attachments.length}</span></button></div>
          {tab === "timeline" ? <>
            <section className="panel timeline-panel">
              <div className="timeline-toolbar"><div><div className="panel-label"><span className="label-mark" /> CHRONOLOGICAL EVIDENCE</div><strong>From first report to now</strong></div><button className="button button-outline button-small" onClick={() => setShowEventForm(true)}><Plus size={14} /> Add event</button></div>
              {timeline.length ? <div className="timeline">
                {detail.timelineMeta?.hasOlder && <button className="load-earlier-button" onClick={loadOlderEvents} disabled={loadingOlder}>{loadingOlder ? <span className="spinner" /> : <ArrowDown size={13} />}{loadingOlder ? "Loading earlier events…" : "Load earlier events"}</button>}
                {timeline.map((event) => <article className="timeline-event" key={event._id}>
                  <div className="timeline-rail"><EventIcon type={event.eventType} /></div>
                  <div className="timeline-content">
                    <div className="timeline-event-heading"><strong>{event.title}</strong><time>{formatDate(event.occurredAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div>
                    <div className="timeline-byline"><Avatar name={event.userId?.name || "Developer"} size="xs" /> {event.userId?.name || "A developer"} <span>·</span> {eventLabels[event.eventType] || "Event"}</div>
                    {event.description && <p className="timeline-description">{event.description}</p>}
                    {(event.filePath || event.commitHash) && <div className="event-reference">{event.filePath && <span><Code2 size={13} />{event.filePath}</span>}{event.commitHash && <span><GitCommitHorizontal size={13} />{event.commitHash}</span>}</div>}
                    {event.errorMessage && <pre className="error-code"><Terminal size={14} /><code>{event.errorMessage}</code></pre>}
                    {event.stackTrace && <details className="stack-trace"><summary>View stack trace <ArrowDown size={12} /></summary><pre>{event.stackTrace}</pre></details>}
                    {(event.oldCode || event.newCode) && <div className="code-diff">
                      <div className="code-diff-head"><Code2 size={13} /> CODE SNAPSHOT <span>{event.filePath || "source file"}</span></div>
                      {event.oldCode && <pre className="code-removed"><i><X size={12} /></i>{event.oldCode}</pre>}
                      {event.newCode && <pre className="code-added"><i><Plus size={12} /></i>{event.newCode}</pre>}
                    </div>}
                  </div>
                </article>)}
              </div> : <EmptyState icon={GitCommitHorizontal} title="The timeline is waiting" description="Add a code change, error log, or note to start reconstructing what happened." action={<button className="button button-primary" onClick={() => setShowEventForm(true)}><Plus size={15} /> Add first event</button>} />}
            </section>
            <section className="panel comments-panel">
              <div className="panel-heading"><div><div className="panel-label"><span className="label-mark mint-mark" /> THINK OUT LOUD</div><h2>Investigation notes <span className="heading-count">{detail.comments.length}</span></h2></div></div>
              <form className="comment-composer" onSubmit={submitComment}><Avatar name={detail.bug.reportedBy?.name || "Developer"} /><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a theory, finding, or next step…" /><button className="icon-button send-button" aria-label="Send note" disabled={sending || !comment.trim()}><Send size={16} /></button></form>
              <div className="comments-list">{detail.comments.map((item) => <div className="comment-item" key={item._id}><Avatar name={item.userId?.name || "Developer"} size="sm" /><span><strong>{item.userId?.name || "A developer"} <time>{formatDate(item.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></strong><p>{item.message}</p></span></div>)}</div>
            </section>
          </> : <EvidencePanel attachments={detail.attachments} location={location} onUpload={uploadFile} uploading={uploading} />}
        </div>
        <aside className="bug-side-column">
          <section className="panel bug-summary-panel">
            <div className="panel-label"><span className="label-mark orange-mark" /> THE SCENE</div><h2>What happened?</h2>
            <p className="bug-description">{bug.description}</p>
            <div className="scene-facts">
              <div><span>AFFECTED FILE</span><strong className="mono-text">{bug.affectedFile || "Not specified"}</strong></div>
              <div><span>ENVIRONMENT</span><strong>{bug.environment || "Not specified"}</strong></div>
              <div><span>REPORTED</span><strong>{formatDate(bug.createdAt)}</strong></div>
              <div><span>ASSIGNED TO</span><strong>{bug.assignedTo?.name || "Unassigned"}</strong></div>
            </div>
          </section>
          <section className="analysis-card">
            <div className="analysis-card-top"><span className="analysis-icon"><Sparkles size={16} /></span><span>REWIND ANALYSIS <i>RULE-BASED</i></span></div>
            <h2>Could a change be related?</h2>
            <p>Compare the first known error against earlier code changes, affected files, and shared error terms.</p>
            <button className="button button-analysis" onClick={runAnalysis} disabled={analyzing}>{analyzing ? <><span className="spinner" /> Reading the timeline…</> : <><Play size={14} /> Run correlation analysis <ArrowUpRight size={14} /></>}</button>
            <div className="analysis-disclaimer">A ranking is a lead to investigate — not proof of cause.</div>
          </section>
          {analysis && <section className="panel analysis-results">
            <div className="panel-label"><span className="label-mark" /> INVESTIGATION LEADS</div>
            <h2>Potentially related changes</h2>
            <p className="first-error-notice"><Terminal size={13} /> First known error · {formatDate(analysis.firstError.occurredAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
            {analysis.candidates.length ? analysis.candidates.map((candidate) => <div className="candidate-card" key={candidate.eventId}>
              <div className="candidate-score"><strong>{candidate.score}</strong><span>RANK</span></div>
              <div className="candidate-main"><strong>{candidate.title}</strong><small>{candidate.filePath || candidate.commitHash || "Code change"} · {formatDate(candidate.occurredAt, { month: "short", day: "numeric" })}</small>
                <ul>{candidate.evidence.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                <div className="candidate-actions"><button onClick={() => decideCause(candidate.eventId, "confirmed")}><Check size={13} /> Confirm</button><button onClick={() => decideCause(candidate.eventId, "rejected")}><X size={13} /> Not the cause</button></div>
              </div>
            </div>) : <p className="no-candidates">No earlier code changes matched the available evidence. Try adding more events to the timeline.</p>}
            <p className="analysis-disclaimer">{analysis.disclaimer}</p>
          </section>}
          {bug.rootCauseDecision && <section className="cause-decision"><span>{bug.rootCauseDecision === "confirmed" ? <Check size={15} /> : <X size={15} />}</span><div><strong>Suspected cause {bug.rootCauseDecision}</strong><p>{bug.rootCause}</p></div></section>}
          <section className="panel evidence-mini">
            <div className="panel-heading"><div><div className="panel-label"><span className="label-mark blue-mark" /> SUPPORTING MATERIAL</div><h2>Evidence <span className="heading-count">{detail.attachments.length}</span></h2></div><button className="icon-button" onClick={() => setTab("evidence")} aria-label="View evidence"><ArrowUpRight size={15} /></button></div>
            {detail.attachments.slice(0, 3).map((file) => <a key={file._id} href={`${location}${file.fileUrl}`} target="_blank" rel="noreferrer" className="attachment-row"><span><FileText size={14} /></span><strong>{file.fileName}</strong><ArrowUpRight size={13} /></a>)}
            {!detail.attachments.length && <div className="no-attachments">Logs, screenshots, and files will appear here.</div>}
            <button className="add-evidence-button" onClick={() => setTab("evidence")}><Plus size={13} /> Add evidence</button>
          </section>
        </aside>
      </div>
      {showEventForm && <EventForm bugId={id} onClose={() => setShowEventForm(false)} onCreated={() => { setShowEventForm(false); load(); }} />}
    </>}
  </>;
}

function EvidencePanel({ attachments, location, onUpload, uploading }) {
  return <section className="panel evidence-panel">
    <div className="panel-heading"><div><div className="panel-label"><span className="label-mark blue-mark" /> FILES & INVESTIGATION MATERIAL</div><h2>Evidence <span className="heading-count">{attachments.length}</span></h2></div><label className="button button-outline button-small upload-label"><Upload size={14} /> {uploading ? "Uploading…" : "Upload evidence"}<input type="file" onChange={onUpload} disabled={uploading} /></label></div>
    <p className="evidence-intro">Keep logs, screenshots, and supporting files alongside the bug timeline. Files up to 10 MB are accepted.</p>
    {attachments.length ? <div className="evidence-grid">{attachments.map((file) => <a className="evidence-file" href={`${location}${file.fileUrl}`} target="_blank" rel="noreferrer" key={file._id}><span className="evidence-file-icon"><FileText size={20} /></span><strong>{file.fileName}</strong><small>{(file.fileSize / 1024).toFixed(0)} KB · {file.fileType}</small><ArrowUpRight size={14} /></a>)}</div> : <EmptyState icon={Paperclip} title="No evidence attached" description="Upload a screenshot or a log file to keep the investigation in context." />}
  </section>;
}

function EventForm({ bugId, onClose, onCreated }) {
  const [type, setType] = useState("code_changed");
  const [form, setForm] = useState({ title: "", description: "", filePath: "", commitHash: "", occurredAt: "", oldCode: "", newCode: "", errorMessage: "", stackTrace: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isError = type === "error_logged";
  const isCode = type === "code_changed";
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/bugs/${bugId}/events`, { ...form, eventType: type, occurredAt: form.occurredAt || undefined });
      onCreated();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }
  return <Modal title="Add timeline event" eyebrow="KEEP THE STORY STRAIGHT" onClose={onClose} wide>
    <form className="form-grid" onSubmit={submit}>
      <label className="field">Event type<select value={type} onChange={(event) => setType(event.target.value)}><option value="code_changed">Code change</option><option value="commit_added">Commit</option><option value="error_logged">Error log</option><option value="note_added">Investigation note</option></select></label>
      <label className="field">When did it happen? <span className="field-hint">optional</span><input type="datetime-local" value={form.occurredAt} onChange={(event) => setForm({ ...form, occurredAt: event.target.value })} /></label>
      <label className="field field-span">Event title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={isError ? "401 Unauthorized on login" : isCode ? "Updated token validation middleware" : "What did you discover?"} required /></label>
      <label className="field field-span">Details<textarea rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add context that will help the next person follow the trail…" /></label>
      {(isCode || type === "commit_added") && <label className="field">File path<input value={form.filePath} onChange={(event) => setForm({ ...form, filePath: event.target.value })} placeholder="src/middleware/auth.js" /></label>}
      {type === "commit_added" && <label className="field">Commit hash<input value={form.commitHash} onChange={(event) => setForm({ ...form, commitHash: event.target.value })} placeholder="a1b2c3d" /></label>}
      {isError && <><label className="field field-span">Error message<textarea rows="2" value={form.errorMessage} onChange={(event) => setForm({ ...form, errorMessage: event.target.value })} placeholder="Paste the error message…" /></label><label className="field field-span">Stack trace <span className="field-hint">optional</span><textarea rows="3" className="code-textarea" value={form.stackTrace} onChange={(event) => setForm({ ...form, stackTrace: event.target.value })} placeholder="Error: Unauthorized&#10;    at verifyToken (…)" /></label></>}
      {isCode && <><label className="field field-span">Previous code <span className="field-hint">optional</span><textarea rows="3" className="code-textarea" value={form.oldCode} onChange={(event) => setForm({ ...form, oldCode: event.target.value })} placeholder="The code before the change…" /></label><label className="field field-span">Updated code <span className="field-hint">optional</span><textarea rows="3" className="code-textarea" value={form.newCode} onChange={(event) => setForm({ ...form, newCode: event.target.value })} placeholder="The code after the change…" /></label></>}
      {error && <div className="error-banner field-span">{error}</div>}
      <div className="field-span form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Adding…" : "Add to timeline"}</button></div>
    </form>
  </Modal>;
}
