import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DailyLogPage } from "./pages/DailyLogPage";
import { WeeklySchedulePage } from "./pages/WeeklySchedulePage";
import { VideoTrackerPage } from "./pages/VideoTrackerPage";
import { AuthPage } from "./pages/AuthPage";
import { Card, CardContent } from "./components/ui/card";
import { Calendar, Video, ArrowRight, Clock, CheckCircle, CalendarDays } from "lucide-react";
import { ScheduleProvider } from "./context/ScheduleContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Dashboard() {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Good morning, Aman</h1>
        <p className="text-on-surface-variant text-lg font-medium">Here's an overview of your tasks and video production pipeline.</p>
      </div>
      
      {/* Stats Row */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Videos to Review", value: "3", icon: Video, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tasks Today", value: "7", icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Hours Logged", value: "4.5", icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Completion Rate", value: "92%", icon: CheckCircle, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <Card key={i} className="border border-outline-variant/10 shadow-sm bg-surface-container-lowest rounded-[24px]">
            <CardContent className="p-8 flex flex-col gap-4">
              <div className={`p-4 rounded-2xl w-fit ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="mt-2">
                <h3 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">{stat.value}</h3>
                <p className="text-[10px] font-bold text-on-surface-variant mt-2 uppercase tracking-widest">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Quick Access</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Link to="/weekly-plan" className="group block">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-outline-variant/10 bg-surface-container-lowest rounded-[24px]">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="bg-surface-container-low p-4 rounded-2xl group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-outline-variant group-hover:text-primary transition-colors transform group-hover:translate-x-1 duration-300" />
                </div>
                <div className="mt-8">
                  <h3 className="text-2xl font-headline font-bold text-on-surface">Weekly Plan</h3>
                  <p className="text-on-surface-variant mt-3 leading-relaxed text-sm font-medium">
                    Plan your upcoming week, set targets, and define your daily blocks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/daily-log" className="group block">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-outline-variant/10 bg-surface-container-lowest rounded-[24px]">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="bg-surface-container-low p-4 rounded-2xl group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                    <Calendar className="h-7 w-7" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-outline-variant group-hover:text-primary transition-colors transform group-hover:translate-x-1 duration-300" />
                </div>
                <div className="mt-8">
                  <h3 className="text-2xl font-headline font-bold text-on-surface">Daily Log</h3>
                  <p className="text-on-surface-variant mt-3 leading-relaxed text-sm font-medium">
                    Manage your daily schedule, log actual times, and track performance against SOPs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/video-tracker" className="group block">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-outline-variant/10 bg-surface-container-lowest rounded-[24px]">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="bg-surface-container-low p-4 rounded-2xl group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                    <Video className="h-7 w-7" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-outline-variant group-hover:text-primary transition-colors transform group-hover:translate-x-1 duration-300" />
                </div>
                <div className="mt-8">
                  <h3 className="text-2xl font-headline font-bold text-on-surface">Video Production</h3>
                  <p className="text-on-surface-variant mt-3 leading-relaxed text-sm font-medium">
                    Collaborate on video creation, from scripting and recording to editing and final approval.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ScheduleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="weekly-plan" element={<WeeklySchedulePage />} />
              <Route path="daily-log" element={<DailyLogPage />} />
              <Route path="video-tracker" element={<VideoTrackerPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ScheduleProvider>
    </AuthProvider>
  );
}
