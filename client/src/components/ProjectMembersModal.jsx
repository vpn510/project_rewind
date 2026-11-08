import { useEffect, useState } from "react";
import { Check, UsersRound } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import { Avatar, ErrorBanner, Loading } from "./Shared";

export default function ProjectMembersModal({ project, onClose, onSaved }) {
  const { user } = useAuth();
  const [developers, setDevelopers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/auth/developers"), api.get(`/projects/${project._id}`)])
      .then(([developerResponse, projectResponse]) => {
        setDevelopers(developerResponse.data.filter((developer) => developer._id !== projectResponse.data.owner._id));
        setSelected(projectResponse.data.members.map((member) => member._id).filter((id) => id !== projectResponse.data.owner._id));
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [project._id]);

  function toggle(id) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await api.put(`/projects/${project._id}`, { members: [...selected, project.owner._id] });
      onSaved();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return <Modal title="Manage project members" eyebrow={project.name} onClose={onClose}>
    {loading ? <Loading label="Loading team members" /> : <div className="member-picker">
      <p>Choose who can read and contribute to this project’s investigations.</p>
      {developers.map((developer) => <button type="button" className={`member-option ${selected.includes(developer._id) ? "member-selected" : ""}`} onClick={() => toggle(developer._id)} key={developer._id}>
        <Avatar name={developer.name} size="sm" /><span><strong>{developer.name}</strong><small>{developer.email}{developer._id === user?.id ? " · you" : ""}</small></span><i>{selected.includes(developer._id) && <Check size={14} />}</i>
      </button>)}
      {!developers.length && <div className="member-empty"><UsersRound size={17} /> No other accounts are available yet.</div>}
      <ErrorBanner message={error} />
      <div className="form-actions"><button className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save members"}</button></div>
    </div>}
  </Modal>;
}
