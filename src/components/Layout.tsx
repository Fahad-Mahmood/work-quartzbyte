import { Outlet, Link, useLocation } from "react-router-dom";
import { Calendar, Video, LayoutDashboard, CheckCircle2, CalendarDays, LogOut } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Weekly Plan", href: "/weekly-plan", icon: CalendarDays },
    { name: "Daily Log", href: "/daily-log", icon: Calendar },
    { name: "Video Tracker", href: "/video-tracker", icon: Video },
  ];

  return (
    <div className="flex min-h-screen w-full bg-surface">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-outline-variant/20 bg-surface-container-lowest sm:flex">
        <div className="flex h-20 items-center px-8 border-b border-outline-variant/10">
          <Link to="/" className="flex items-center gap-3 font-headline font-extrabold text-on-surface">
            <div className="bg-primary text-on-primary p-2 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <span className="text-xl tracking-tight">WakeUp Better</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-8">
          <nav className="grid items-start px-4 gap-2 text-base font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200",
                    isActive
                      ? "bg-primary text-on-primary font-bold shadow-md shadow-primary/20"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-on-primary" : "text-on-surface-variant/70")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-outline-variant/10">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface truncate max-w-[120px]">{user?.email || 'User'}</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">Reviewer</span>
              </div>
            </div>
            <button onClick={signOut} className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error-container">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col sm:pl-72 w-full">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-md px-4 sm:hidden">
          <div className="flex items-center gap-2 font-headline font-bold text-on-surface">
            <div className="bg-primary text-on-primary p-1 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span>WakeUp Better</span>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-10 md:p-12 max-w-[1400px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
