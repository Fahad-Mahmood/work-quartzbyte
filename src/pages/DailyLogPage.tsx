import { useState, useEffect, useRef, useCallback } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { startOfWeek, addDays, format, addDays as addD } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, Save, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useSchedule, Status } from "../context/ScheduleContext";

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  Completed:   "bg-green-100 text-green-700 border-green-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Pending:     "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
  Overdue:     "bg-red-100 text-red-500 border-red-200",
};

const STATUSES: Status[] = ["Completed", "In Progress", "Pending", "Overdue"];

function parsePlannedMins(time: string): number {
  const parts = time.split(" - ");
  if (parts.length !== 2) return 0;
  const [sh, sm] = parts[0].split(":").map(Number);
  const [eh, em] = parts[1].split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

interface TaskRowProps {
  task: { id: string; name: string; category: string; time: string; notes?: string };
  planned: number;
  savedActual: string;
  savedStatus: Status;
  onCommitActual: (taskId: string, value: string) => void;
  onStatusChange: (taskId: string, value: string) => void;
}

function TaskRow({ task, planned, savedActual, savedStatus, onCommitActual, onStatusChange }: TaskRowProps) {
  const [localActual, setLocalActual] = useState(savedActual);

  // Sync if the saved value changes externally (e.g. day switch)
  useEffect(() => { setLocalActual(savedActual); }, [savedActual]);

  const actualNum = Number(localActual);
  const hasActual = localActual !== "" && !isNaN(actualNum);
  const diff = hasActual ? actualNum - planned : null;

  const catBadgeColor = (() => {
    switch (task.category) {
      case "Recording":    return "bg-primary/10 text-primary";
      case "Cold Calling": return "bg-secondary-container text-secondary";
      case "Learning":     return "bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant";
      case "Internal":     return "bg-surface-container-high text-on-surface-variant";
      default:             return "bg-slate-100 text-slate-600";
    }
  })();

  return (
    <div className="grid grid-cols-[1fr_130px_90px_90px_70px_130px] gap-4 px-8 py-5 items-center hover:bg-surface-container-high/50 transition-colors group">
      {/* Task name + notes */}
      <div>
        <p className="font-bold text-on-surface text-sm leading-snug">{task.name}</p>
        {task.notes && <p className="text-[11px] text-on-surface-variant mt-0.5">{task.notes}</p>}
      </div>

      {/* Category badge */}
      <div className="flex justify-center">
        <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider", catBadgeColor)}>
          {task.category.toUpperCase()}
        </span>
      </div>

      {/* Planned */}
      <div className="text-center font-semibold text-sm text-on-surface">{planned}</div>

      {/* Actual — local state only, flush on blur */}
      <div className="flex justify-center">
        <input
          type="number"
          min="0"
          value={localActual}
          onChange={e => setLocalActual(e.target.value)}
          onBlur={() => onCommitActual(task.id, localActual)}
          placeholder="—"
          className="w-16 h-9 text-center text-sm font-bold bg-surface-container border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-on-surface-variant/40"
        />
      </div>

      {/* Diff */}
      <div className="text-center">
        {diff === null ? (
          <span className="text-on-surface-variant/40 text-sm font-bold">0</span>
        ) : diff === 0 ? (
          <span className="text-on-surface-variant text-sm font-bold">0</span>
        ) : diff > 0 ? (
          <span className="text-red-500 font-bold text-sm">+{diff}</span>
        ) : (
          <span className="text-green-600 font-bold text-sm">{diff}</span>
        )}
      </div>

      {/* Status dropdown */}
      <div className="flex justify-center">
        <div className="relative">
          <select
            value={savedStatus}
            onChange={e => onStatusChange(task.id, e.target.value)}
            className={cn(
              "appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
              STATUS_STYLES[savedStatus] ?? STATUS_STYLES["Pending"]
            )}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-60" />
        </div>
      </div>
    </div>
  );
}

export function DailyLogPage() {
  usePageTitle('Daily Log');
  const { getTasksForDate, getLogsForDate, updateTaskLog, isLoading } = useSchedule();

  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 5 }).map((_, i) => {
    const date = addDays(start, i);
    return {
      id: format(date, "yyyy-MM-dd"),
      label: format(date, "EEEE"),
      shortLabel: format(date, "EEE"),
      dateStr: format(date, "MMM d"),
      fullDate: date,
    };
  });

  const [selectedDay, setSelectedDay] = useState(format(today, "yyyy-MM-dd"));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const tasks = getTasksForDate(selectedDay);
  const logs = getLogsForDate(selectedDay);

  // Reset visible count when day changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedDay]);

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, tasks.length));
  }, [tasks.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleTasks = tasks.slice(0, visibleCount);

  // Totals
  const plannedTotal = tasks.reduce((sum, t) => sum + parsePlannedMins(t.time), 0);
  const actualTotal  = tasks.reduce((sum, t) => {
    const val = Number(logs[t.id]?.actual);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleActualChange = (taskId: string, value: string) => {
    const currentLog = logs[taskId] || { actual: "", status: "Pending" };
    updateTaskLog(selectedDay, taskId, { ...currentLog, actual: value });
  };

  const handleStatusChange = (taskId: string, value: string) => {
    const currentLog = logs[taskId] || { actual: "", status: "Pending" };
    updateTaskLog(selectedDay, taskId, { ...currentLog, status: value as Status });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const selectedDayObj = weekDays.find(d => d.id === selectedDay);
  const selectedDayLabel = selectedDayObj
    ? format(selectedDayObj.fullDate, "EEEE, MMM d")
    : format(new Date(selectedDay), "EEEE, MMM d");

  const navigateDay = (dir: -1 | 1) => {
    const current = new Date(selectedDay + "T00:00:00");
    const next = addD(current, dir);
    setSelectedDay(format(next, "yyyy-MM-dd"));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-[1100px] mx-auto animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-1">Task Log</h1>
          <p className="text-on-surface-variant text-sm font-medium">
            Daily operational actuals for{" "}
            <span className="font-bold text-on-surface">{selectedDayLabel}</span>
          </p>
        </div>

        {/* Planned / Actual totals */}
        <div className="flex items-stretch rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-container-lowest">
          <div className="px-8 py-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1">Planned Total</p>
            <p className="text-3xl font-headline font-extrabold text-on-surface">{plannedTotal}m</p>
          </div>
          <div className="w-px bg-primary/30 my-3" />
          <div className="px-8 py-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1">Actual Total</p>
            <p className="text-3xl font-headline font-extrabold text-primary">{actualTotal}m</p>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-on-surface-variant bg-surface-container px-2 py-1 rounded-lg">
          <button onClick={() => navigateDay(-1)} className="hover:text-primary p-0.5">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => navigateDay(1)} className="hover:text-primary p-0.5">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {weekDays.map(day => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[88px] px-4 py-2.5 rounded-xl transition-all border text-center",
                selectedDay === day.id
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low"
              )}
            >
              <span className={cn("text-[9px] font-bold uppercase tracking-widest", selectedDay === day.id ? "text-primary-container/80" : "text-on-surface-variant/60")}>
                {day.shortLabel}
              </span>
              <span className="text-base font-headline font-extrabold mt-0.5">{day.dateStr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task Table */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm">
          <h3 className="text-xl font-headline font-bold text-on-surface">No tasks scheduled for this day.</h3>
          <p className="text-on-surface-variant mt-2 text-sm font-medium">Go to the Weekly Plan to add tasks.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_130px_90px_90px_70px_130px] gap-4 px-8 py-3 bg-surface-container border-b border-outline-variant/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Task Description</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Category</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Planned<br />(Mins)</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Actual<br />(Mins)</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Diff</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-outline-variant/10">
            {visibleTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                planned={parsePlannedMins(task.time)}
                savedActual={logs[task.id]?.actual ?? ""}
                savedStatus={(logs[task.id]?.status as Status) || task.status}
                onCommitActual={handleActualChange}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-outline-variant/10 bg-surface-container-lowest/60">
            <p className="text-xs text-on-surface-variant font-medium">
              Showing <span className="font-bold text-on-surface">{visibleTasks.length}</span> of{" "}
              <span className="font-bold text-on-surface">{tasks.length}</span> daily tasks
            </p>
            <div className="flex items-center gap-3">
              {savedBanner && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-bold animate-in fade-in duration-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-on-surface text-surface text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving…" : "Submit Final Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
