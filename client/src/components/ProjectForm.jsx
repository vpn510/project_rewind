import { useState } from "react";
import api, { getErrorMessage } from "../services/api";
import Modal from "./Modal";
import { ErrorBanner } from "./Shared";

export default function ProjectForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", technologies: "", repositoryUrl: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/projects", { ...form, technologies: form.technologies.split(",").map((value) => value.trim()).filter(Boolean) });
      onCreated();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create a project" eyebrow="New workspace" onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label className="field">Project name<input autoFocus name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Atlas storefront" required /></label>
        <label className="field">Description<textarea name="description" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What are you building?" /></label>
        <label className="field">Technologies <span className="field-hint">comma separated</span><input name="technologies" value={form.technologies} onChange={(event) => setForm({ ...form, technologies: event.target.value })} placeholder="React, Node.js, MongoDB" /></label>
        <label className="field">Repository URL <span className="field-hint">optional</span><input type="url" name="repositoryUrl" value={form.repositoryUrl} onChange={(event) => setForm({ ...form, repositoryUrl: event.target.value })} placeholder="https://github.com/…" /></label>
        <ErrorBanner message={error} />
        <div className="form-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Creating…" : "Create project"}</button></div>
      </form>
    </Modal>
  );
}
