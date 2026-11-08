import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, GitBranch, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { ErrorBanner } from "../components/Shared";

export default function AuthPage() {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(form, register);
      navigate("/");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-left">
        <div className="brand auth-brand"><span className="brand-mark"><span /><span /><span /></span><span className="brand-word">rewind<span className="brand-period">.</span></span></div>
        <div className="auth-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> THE DEBUGGING WORKSPACE</div>
          <h1>Every bug has<br />a <span>backstory.</span></h1>
          <p>Rewind the timeline. Connect the evidence. Find out what really happened.</p>
        </div>
        <div className="auth-feature-list">
          <div><span className="feature-icon"><GitBranch size={16} /></span><span><strong>Follow the chain of events</strong><small>One chronological view, from change to crash.</small></span></div>
          <div><span className="feature-icon"><Sparkles size={16} /></span><span><strong>Find the signal in the noise</strong><small>Transparent correlation, never black-box guesses.</small></span></div>
          <div><span className="feature-icon"><Layers3 size={16} /></span><span><strong>Keep the whole story together</strong><small>Logs, commits, code, and team notes in one place.</small></span></div>
        </div>
        <div className="auth-footnote"><ShieldCheck size={14} /> Your evidence stays in your workspace.</div>
        <div className="auth-decoration"><span>01</span><i /><span>THE STORY BEHIND THE STACK TRACE</span></div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-top"><span className="eyebrow">WELCOME {register ? "ABOARD" : "BACK"}</span><span className="auth-step">01 <i /> 02</span></div>
          <h2>{register ? "Start your story." : "Pick up the thread."}</h2>
          <p className="auth-subtitle">{register ? "Create your workspace and start understanding the why." : "Sign in to your engineering workspace."}</p>
          <form onSubmit={submit} className="form-stack">
            {register && <label className="field">Your name<input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" required /></label>}
            <label className="field">Work email<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" required /></label>
            <label className="field">Password<input type="password" autoComplete={register ? "new-password" : "current-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={register ? "At least 8 characters" : "Enter your password"} minLength={register ? 8 : undefined} required /></label>
            <ErrorBanner message={error} />
            <button className="button button-primary auth-submit" disabled={loading}>{loading ? "One moment…" : register ? "Create your account" : "Sign in to Rewind"}<ArrowRight size={16} /></button>
          </form>
          <div className="auth-switch">{register ? "Already have an account?" : "New to Rewind?"}<button onClick={() => { setRegister(!register); setError(""); }}> {register ? "Sign in" : "Create an account"}</button></div>
          <div className="auth-legal">By continuing, you agree to keep your evidence safe and your theories testable.</div>
        </div>
        <div className="auth-right-footer"><span>PROJECT REWIND</span><span>DON’T JUST FIX IT. UNDERSTAND IT.</span></div>
      </div>
    </main>
  );
}
