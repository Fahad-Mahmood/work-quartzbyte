import { useState, useEffect } from "react";
import { usePageTitle } from "@/src/hooks/usePageTitle";
import { startOfWeek, addDays, addWeeks, format } from "date-fns";
import { Button } from "@/src/components/ui/button";
import { Plus, Share, Filter, ChevronLeft, ChevronRight, Edit, Clock, CheckCircle, AlertCircle, PlayCircle, Download, BarChart2, Copy } from "lucide-react";
import { useSchedule, Category, Status, Task } from "@/src/context/ScheduleContext";
import { useUserProfile } from "@/src/context/ProfileContext";
import { cn, formatTimeSlot } from "@/src/lib/utils";
import { TaskDrawer } from "@/src/components/TaskDrawer";

const CATEGORIES: Category[] = ['Recording', 'Cold Calling', 'Learning', 'Internal'];
const STATUSES: Status[] = ['Completed', 'In Progress', 'Pending', 'Overdue'];

export function WeeklySchedulePage() {
  usePageTitle('Weekly Plan');
  const { getTasksForDate, addTask, isLoading } = useSchedule();
  const { profile } = useUserProfile();
  const today = new Date();

  const [weekOffset, setWeekOffset] = useState(0);
  const [isCopying, setIsCopying]   = useState(false);
  const [dayWindowStart, setDayWindowStart] = useState(0);

  const getResponsiveWindow = () => {
    if (typeof window === 'undefined') return 5;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 5;
  };
  const [WINDOW, setWINDOW] = useState(getResponsiveWindow);

  useEffect(() => {
    const handler = () => {
      const next = getResponsiveWindow();
      setWINDOW(next);
      setDayWindowStart(prev => Math.min(prev, 7 - next));
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const shiftWindow = (dir: 1 | -1) => {
    setDayWindowStart(prev => Math.max(0, Math.min(7 - WINDOW, prev + dir)));
  };

  const start = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), weekOffset);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(start, i);
    return {
      id: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE'),
      shortLabel: format(date, 'EEE'),
      dateStr: format(date, 'MMM d'),
    };
  });

  const visibleDays = weekDays.slice(dayWindowStart, dayWindowStart + WINDOW);
  const canShiftLeft  = dayWindowStart > 0;
  const canShiftRight = dayWindowStart + WINDOW < 7;

  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<Status | 'All Statuses'>('All Statuses');

  // Drawer state
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerTask, setDrawerTask]       = useState<Task | null>(null);
  const [drawerTaskDate, setDrawerTaskDate] = useState<string | null>(null);
  const [drawerInitDate, setDrawerInitDate] = useState<string | null>(null);

  const openAddDrawer = (date?: string) => {
    setDrawerTask(null);
    setDrawerTaskDate(null);
    setDrawerInitDate(date ?? weekDays[0]?.id ?? null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (task: Task, date: string) => {
    setDrawerTask(task);
    setDrawerTaskDate(date);
    setDrawerInitDate(null);
    setDrawerOpen(true);
  };

  const dateRangeStr = `${format(start, 'MMM d')} - ${format(addDays(start, 6), 'd, yyyy')}`;

  const handleWeekOffset = (delta: number) => {
    setWeekOffset((w: number) => w + delta);
    setDayWindowStart(0);
  };

  const handleCopyToNextWeek = async () => {
    setIsCopying(true);
    try {
      for (const day of weekDays) {
        const tasks = getTasksForDate(day.id);
        const nextDate = format(addDays(new Date(day.id), 7), 'yyyy-MM-dd');
        for (const task of tasks) {
          await addTask(nextDate, task.category, task.name, task.time, {
            assignedTo: task.assignedTo,
            notes: task.notes,
            status: 'Pending',
          });
        }
      }
      handleWeekOffset(1);
    } finally {
      setIsCopying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'Recording':   return 'bg-primary text-white';
      case 'Cold Calling': return 'bg-secondary-container text-secondary';
      case 'Learning':    return 'bg-tertiary-fixed-dim text-on-tertiary-fixed-variant';
      case 'Internal':    return 'bg-on-surface-variant text-white';
      default:            return 'bg-slate-200 text-slate-600';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Completed': return 'bg-tertiary-fixed-dim text-on-tertiary-fixed';
      case 'In Progress': return 'bg-secondary-fixed text-on-secondary-container';
      case 'Overdue': return 'bg-error-container text-on-error-container';
      case 'Pending': return 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const calcHours = (tasks: Task[]) => {
    const total = tasks.reduce((sum, t) => {
      const parts = t.time.split(' - ');
      if (parts.length !== 2) return sum;
      const [sh, sm] = parts[0].split(':').map(Number);
      const [eh, em] = parts[1].split(':').map(Number);
      return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }, 0);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m > 0 ? `${h}.${Math.round(m * 10 / 60)}h` : `${h}h`;
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-3 w-3" />;
      case 'In Progress': return <PlayCircle className="h-3 w-3" />;
      case 'Overdue': return <AlertCircle className="h-3 w-3" />;
      case 'Pending': return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  const totalTasks = weekDays.flatMap(day => getTasksForDate(day.id));
  const filteredTasks = totalTasks.filter(t =>
    (filterCategory === 'All' || t.category === filterCategory) &&
    (filterStatus === 'All Statuses' || t.status === filterStatus)
  );

  // Real insight calculations
  const parseMinutes = (time: string) => {
    const parts = time.split(' - ');
    if (parts.length !== 2) return 0;
    const [sh, sm] = parts[0].split(':').map(Number);
    const [eh, em] = parts[1].split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  };

  const totalMinutes = filteredTasks.reduce((sum, t) => sum + parseMinutes(t.time), 0);
  const totalHoursDisplay = totalMinutes % 60 === 0
    ? `${totalMinutes / 60}`
    : (totalMinutes / 60).toFixed(1);

  // Top category by total minutes
  const categoryMinutes: Record<string, number> = {};
  filteredTasks.forEach(t => {
    categoryMinutes[t.category] = (categoryMinutes[t.category] ?? 0) + parseMinutes(t.time);
  });
  const topCategory = Object.entries(categoryMinutes).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName  = topCategory?.[0] ?? '—';
  const topCategoryHours = topCategory ? (topCategory[1] / 60).toFixed(1) : '0';

  // Efficiency = completed / total (all week, unfiltered)
  const completedCount = totalTasks.filter(t => t.status === 'Completed').length;
  const efficiencyRate  = totalTasks.length > 0
    ? Math.round((completedCount / totalTasks.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        {/* Top row: avatar + title + name badge */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-lg sm:text-xl font-bold text-primary ring-4 ring-primary-fixed/30">
              {(profile?.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-headline font-extrabold text-on-surface tracking-tight">Weekly Schedule</h2>
              <span className="bg-primary-fixed text-on-primary-fixed-variant px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                {profile?.full_name || 'My Schedule'}
              </span>
            </div>
            {/* Week nav — shown inline on desktop, below on mobile */}
            <div className="hidden sm:flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
                <button onClick={() => handleWeekOffset(-1)} className="hover:text-primary"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-sm font-semibold mx-1">{dateRangeStr}</span>
                <button onClick={() => handleWeekOffset(1)} className="hover:text-primary"><ChevronRight className="h-4 w-4" /></button>
              </div>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} className="text-xs text-primary font-semibold hover:underline">Today</button>
              )}
              <span className="text-xs text-on-surface-variant font-medium hidden md:inline">Standard Hours • 40h/week</span>
            </div>
          </div>
        </div>

        {/* Week nav — mobile only */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="flex items-center gap-1 text-on-surface-variant bg-surface-container px-2 py-1 rounded-md flex-1 justify-center">
            <button onClick={() => handleWeekOffset(-1)} className="hover:text-primary"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-semibold mx-1">{dateRangeStr}</span>
            <button onClick={() => handleWeekOffset(1)} className="hover:text-primary"><ChevronRight className="h-4 w-4" /></button>
          </div>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-primary font-semibold hover:underline px-2">Today</button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 sm:gap-3">
          <Button
            onClick={() => openAddDrawer()}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Add New Task</span>
            <span className="sm:hidden">Add Task</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyToNextWeek}
            disabled={isCopying || totalTasks.length === 0}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">{isCopying ? 'Copying…' : 'Copy to Next Week'}</span>
            <span className="sm:hidden">{isCopying ? '…' : 'Copy'}</span>
          </Button>
          <Button variant="outline" className="p-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors shrink-0">
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quick Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-on-surface-variant" />
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Quick Filter</span>
          </div>
          <button
            onClick={() => { setFilterCategory('All'); setFilterStatus('All Statuses'); }}
            className="text-primary text-xs font-bold hover:underline"
          >Clear All</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-on-surface-variant shrink-0">Category:</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterCategory('All')}
              className={cn("px-3 py-1 rounded-full text-[11px] font-semibold transition-colors", filterCategory === 'All' ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant")}
            >All</button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn("px-3 py-1 rounded-full text-[11px] font-semibold transition-colors", filterCategory === cat ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant")}
              >{cat}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-on-surface-variant shrink-0">Status:</span>
          <select
            className="text-xs font-semibold bg-surface-container border-none rounded-lg focus:ring-0 py-1.5 pl-3 pr-8 text-on-surface"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="All Statuses">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Bento Grid Calendar Layout */}
      <div className="relative">
        {/* Day window nav — shown when there are days to shift to */}
        {canShiftLeft && (
          <button
            onClick={() => shiftWindow(-1)}
            className="absolute -left-5 top-8 z-10 w-9 h-9 rounded-full bg-surface-container-lowest border border-outline-variant/20 shadow-md flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canShiftRight && (
          <button
            onClick={() => shiftWindow(1)}
            className="absolute -right-5 top-8 z-10 w-9 h-9 rounded-full bg-surface-container-lowest border border-outline-variant/20 shadow-md flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Day dots indicator */}
        <div className="flex justify-center gap-1.5 mb-4">
          {weekDays.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setDayWindowStart(Math.min(i, 7 - WINDOW))}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i >= dayWindowStart && i < dayWindowStart + WINDOW
                  ? 'w-5 bg-primary'
                  : 'w-1.5 bg-outline-variant/40 hover:bg-primary/40'
              )}
              title={d.label}
            />
          ))}
        </div>

      <div className={cn("grid gap-4 sm:gap-6", {
        'grid-cols-1': WINDOW === 1,
        'grid-cols-2': WINDOW === 2,
        'grid-cols-3': WINDOW === 3,
        'grid-cols-5': WINDOW === 5,
      })}>
        {visibleDays.map(day => {
          const dayTasks = getTasksForDate(day.id).filter(t => 
            (filterCategory === 'All' || t.category === filterCategory) &&
            (filterStatus === 'All Statuses' || t.status === filterStatus)
          );

          return (
            <div key={day.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2 pb-2 border-b-2 border-primary/20">
                <div>
                  <h3 className="font-headline font-extrabold text-lg text-primary">{day.label}</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{format(new Date(day.id), 'MMM d')}</p>
                </div>
                <span className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded font-bold">
                  {calcHours(dayTasks)}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {dayTasks.map(task => {
                  const catColor = getCategoryColor(task.category);
                  const statColor = getStatusColor(task.status);
                  const statIcon = getStatusIcon(task.status);
                  
                  return (
                    <div key={task.id} className="group bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 hover:border-primary/30 transition-all hover:shadow-md relative overflow-hidden">
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", catColor.split(' ')[0])}></div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn("text-[9px] font-bold uppercase tracking-tight", catColor.split(' ')[1])}>{task.category}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditDrawer(task, day.id)}
                            className="p-1 hover:bg-surface-container rounded-md text-on-surface-variant hover:text-primary transition-colors"
                            title="Edit Task"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-on-surface leading-tight mb-3">{task.name}</p>
                      <div className="flex items-center gap-3 text-on-surface-variant mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-[11px] font-medium">{formatTimeSlot(task.time)}</span>
                        </div>
                      </div>
                      <button className={cn("w-full py-1.5 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-2", statColor)}>
                        {statIcon} {task.status}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Detailed Table View — desktop only */}
      <div className="hidden md:block mt-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-headline font-bold text-2xl text-on-surface">Detailed Ledger View</h3>
          <Button variant="outline" className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-container-low transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/10 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Task Category</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Activity</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Scheduled Day</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Start - End</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Status</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {weekDays.flatMap(day => 
                getTasksForDate(day.id).filter(t => 
                  (filterCategory === 'All' || t.category === filterCategory) &&
                  (filterStatus === 'All Statuses' || t.status === filterStatus)
                ).map(task => {
                  const catColor = getCategoryColor(task.category);
                  const statColor = getStatusColor(task.status);
                  
                  return (
                    <tr key={task.id} className="hover:bg-surface-container-high transition-colors group">
                      <td className="px-8 py-6">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter", catColor.replace('text-', 'text-').replace('bg-', 'bg-opacity-10 bg-'))}>
                          {task.category}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-semibold text-sm">{task.name}</td>
                      <td className="px-8 py-6 text-on-surface-variant text-sm">{day.label}</td>
                      <td className="px-8 py-6 text-right font-mono text-xs">{formatTimeSlot(task.time)}</td>
                      <td className="px-8 py-6 text-right">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase", statColor)}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => openEditDrawer(task, day.id)}
                          className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section — desktop only */}
      <div className="hidden md:grid mt-12 grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-primary text-white p-8 rounded-2xl relative overflow-hidden group shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Total Hours</span>
          <p className="text-5xl font-headline font-extrabold mt-4">{totalHoursDisplay}</p>
          <p className="text-sm mt-2 opacity-80">Scheduled for this week</p>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between border border-outline-variant/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Top Category</span>
            <p className="text-2xl font-headline font-bold text-on-surface mt-4">{topCategoryName}</p>
          </div>
          <div className="flex items-center gap-2 mt-4 text-primary font-bold text-sm">
            <BarChart2 className="h-5 w-5" />
            {topCategoryHours} Hours Total
          </div>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 mb-4 bg-surface-container rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-on-surface-variant" />
          </div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest">Efficiency Rating</p>
          <p className="text-3xl font-headline font-extrabold text-on-surface mt-1">{efficiencyRate}%</p>
        </div>
      </div>

      <TaskDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        weekDays={weekDays}
        initialDate={drawerInitDate}
        task={drawerTask}
        taskDate={drawerTaskDate}
      />
    </div>
  );
}
