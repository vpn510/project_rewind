import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("rewind-token")));

  useEffect(() => {
    if (!localStorage.getItem("rewind-token")) return;
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("rewind-token"))
      .finally(() => setLoading(false));
  }, []);

  async function signIn(credentials, register = false) {
    const { data } = await api.post(register ? "/auth/register" : "/auth/login", credentials);
    localStorage.setItem("rewind-token", data.token);
    setUser(data.user);
    return data.user;
  }

  function signOut() {
    localStorage.removeItem("rewind-token");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
