import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Loading } from "./components/Shared";

const WorkspaceLayout = lazy(() => import("./layouts/WorkspaceLayout"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const BugsPage = lazy(() => import("./pages/BugsPage"));
const BugDetailPage = lazy(() => import("./pages/BugDetailPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Opening your workspace" />;
  return <Suspense fallback={<Loading label="Opening your workspace" />}>
    {!user ? <AuthPage /> : <Routes><Route element={<WorkspaceLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="projects" element={<ProjectsPage />} />
      <Route path="projects/:id" element={<ProjectDetailPage />} />
      <Route path="bugs" element={<BugsPage />} />
      <Route path="bugs/:id" element={<BugDetailPage />} />
      <Route path="activity" element={<ActivityPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route></Routes>}
  </Suspense>;
}
