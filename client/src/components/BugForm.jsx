import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import Modal from "./Modal";
import { ErrorBanner } from "./Shared";

export default function BugForm({ onClose, onCreated, initialProjectId = "" }) {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", projectId: initialProjectId, severity: "medium", environment: "", affectedFile: "", assignedTo: "" });
  const selectedProject = projects.find((project) => project._id === form.projectId);

  useEffect(() => {
    api.get("/projects").then(({ data }) => {
      setProjects(data);
      if (!initialProjectId && data[0]) setForm((current) => ({ ...current, projectId: data[0]._id }));
    }).catch((requestError) => setError(getErrorMessage(requestError)));
  }, [initialProjectId]);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/bugs", form);
      onCreated();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Report a bug" eyebrow="New investigation" onClose={onClose} wide>
      <form className="form-grid" onSubmit={submit}>
        <label className="field field-span">Bug title<input name="title" value={form.title} onChange={update} placeholder="What went wrong?" maxLength="180" required /></label>
        <label className="field field-span">Description<textarea name="description" value={form.description} onChange={update} placeholder="Describe what happened and how to reproduce it…" rows="4" required /></label>
        <label className="field">Project<select name="projectId" value={form.projectId} onChange={update} required>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
        <label className="field">Severity<select name="severity" value={form.severity} onChange={update}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
        <label className="field field-span">Assign to <span className="field-hint">optional · project members only</span><select name="assignedTo" value={form.assignedTo} onChange={update}><option value="">Unassigned</option>{selectedProject?.members?.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select></label>
        <label className="field">Affected file<input name="affectedFile" value={form.affectedFile} onChange={update} placeholder="src/auth/session.js" /></label>
        <label className="field">Environment<input name="environment" value={form.environment} onChange={update} placeholder="Production · Node 22" /></label>
        <div className="field-span"><ErrorBanner message={error} /><div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving || !projects.length}>{saving ? "Creating…" : "Create investigation"}</button></div></div>
      </form>
    </Modal>
  );
}
