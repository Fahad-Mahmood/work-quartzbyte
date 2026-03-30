import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DailyLogPage } from "./pages/DailyLogPage";
import { WeeklySchedulePage } from "./pages/WeeklySchedulePage";
import { VideoTrackerPage } from "./pages/VideoTrackerPage";
import { VideoPipelinePage } from "./pages/VideoPipelinePage";
import { ProfilePage } from "./pages/ProfilePage";
import { DashboardPage } from "./pages/DashboardPage";
import { AuthPage } from "./pages/AuthPage";
import { AddMemberPage } from "./pages/AddMemberPage";
import { TeamPage } from "./pages/TeamPage";
import { ScheduleProvider } from "./context/ScheduleContext";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
      <ScheduleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="weekly-plan" element={<WeeklySchedulePage />} />
              <Route path="daily-log" element={<DailyLogPage />} />
              <Route path="video-tracker" element={<VideoPipelinePage />} />
              <Route path="video-tracker/:id" element={<VideoTrackerPage />} />
              <Route path="settings" element={<ProfilePage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="add-member" element={<AddMemberPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ScheduleProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
