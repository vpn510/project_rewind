import { LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar, PageHeading } from "../components/Shared";

export default function SettingsPage() {
  const { user } = useAuth();
  return <>
    <PageHeading eyebrow="YOUR WORKSPACE, YOUR RULES" title="Settings" description="Manage your account and keep your investigation workspace secure." />
    <div className="settings-grid">
      <section className="panel settings-panel"><div className="panel-label"><span className="label-mark" /> PROFILE</div><h2>Your account</h2><p className="settings-description">The name your teammates see across project timelines.</p><div className="settings-user"><Avatar name={user?.name} /><div><strong>{user?.name}</strong><span>{user?.email}</span></div></div><div className="settings-field"><span>Display name</span><strong>{user?.name}</strong></div><div className="settings-field"><span>Email address</span><strong>{user?.email}</strong></div><div className="settings-readonly"><UserRound size={15} /> Profile editing will be available in a future update.</div></section>
      <section className="panel settings-panel"><div className="panel-label"><span className="label-mark mint-mark" /> SECURITY & PRIVACY</div><h2>Protected by design</h2><p className="settings-description">Project Rewind keeps private project data private to its members.</p><div className="security-row"><span className="security-icon"><LockKeyhole size={16} /></span><span><strong>Password protection</strong><small>Your password is hashed and never stored in plain text.</small></span><i>ACTIVE</i></div><div className="security-row"><span className="security-icon"><ShieldCheck size={16} /></span><span><strong>Private evidence</strong><small>Only authenticated project members can access investigation data.</small></span><i>ACTIVE</i></div><div className="settings-note">For production deployments, configure HTTPS, a unique JWT secret, and a restricted client origin in the server environment.</div></section>
    </div>
  </>;
}
