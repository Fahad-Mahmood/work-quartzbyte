import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useSchedule, Task, Status } from '@/src/context/ScheduleContext';
import { useAuth } from '@/src/context/AuthContext';
import { format } from 'date-fns';

const PREDEFINED_CATEGORIES = ['Recording', 'Cold Calling', 'Learning', 'Internal'];
const STATUSES: Status[] = ['Pending', 'In Progress', 'Completed', 'Overdue'];

const STATUS_COLORS: Record<Status, string> = {
  'Pending':     'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Completed':   'bg-green-100 text-green-700',
  'Overdue':     'bg-red-100 text-red-600',
};

interface WeekDay {
  id: string;
  label: string;
}

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: WeekDay[];
  /** Pre-selected date when opening from a day column */
  initialDate?: string | null;
  /** Task to edit — null/undefined = add mode */
  task?: Task | null;
  /** Date the task belongs to (edit mode) */
  taskDate?: string | null;
}

export function TaskDrawer({ isOpen, onClose, weekDays, initialDate, task, taskDate }: TaskDrawerProps) {
  const { addTask, editTask, removeTask } = useSchedule();
  const { user } = useAuth();
  const isEdit = !!task;

  // Derive a display name for the current user
  const currentUserName: string =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    'Current User';

  // Today's date string — used as default for new tasks
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  // Pick today if it's in the current week, otherwise fall back to first weekday
  const defaultDate = weekDays.find(d => d.id === todayStr)?.id ?? weekDays[0]?.id ?? '';

  const [title, setTitle]                 = useState('');
  const [category, setCategory]           = useState(PREDEFINED_CATEGORIES[0]);
  const [isCustom, setIsCustom]           = useState(false);
  const [customCat, setCustomCat]         = useState('');
  const [status, setStatus]               = useState<Status>('Pending');
  const [assignedTo, setAssignedTo]       = useState(currentUserName);
  const [selectedDate, setSelectedDate]   = useState<string>(defaultDate);
  const [selectedDates, setSelectedDates] = useState<string[]>([defaultDate]);
  const [timeStart, setTimeStart]         = useState('09:00');
  const [timeEnd, setTimeEnd]             = useState('10:00');
  const [notes, setNotes]                 = useState('');
  const [isSaving, setIsSaving]           = useState(false);
  const [isDeleting, setIsDeleting]       = useState(false);

  // Reset / populate form when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setTitle(task.name);
      const predefined = PREDEFINED_CATEGORIES.includes(task.category);
      if (predefined) {
        setCategory(task.category);
        setIsCustom(false);
        setCustomCat('');
      } else {
        setCategory('custom');
        setIsCustom(true);
        setCustomCat(task.category);
      }
      setStatus(task.status);
      setAssignedTo(task.assignedTo ?? currentUserName);
      setSelectedDate(taskDate ?? defaultDate);
      const parts = task.time.split(' - ');
      setTimeStart(parts[0] ?? '09:00');
      setTimeEnd(parts[1] ?? '10:00');
      setNotes(task.notes ?? '');
    } else {
      setTitle('');
      setCategory(PREDEFINED_CATEGORIES[0]);
      setIsCustom(false);
      setCustomCat('');
      setStatus('Pending');
      setAssignedTo(currentUserName);
      setSelectedDate(initialDate ?? defaultDate);
      setSelectedDates([initialDate ?? defaultDate]);
      setTimeStart('09:00');
      setTimeEnd('10:00');
      setNotes('');
    }
  }, [isOpen, task]);

  const effectiveCategory = isCustom ? customCat : category;
  const taskIdLabel = task ? `#LDR-${task.id.slice(-5).toUpperCase()}` : null;

  const handleSave = async () => {
    if (!title.trim()) return;
    if (!isEdit && selectedDates.length === 0) return;
    setIsSaving(true);
    try {
      const timeSlot = `${timeStart} - ${timeEnd}`;
      if (isEdit && task && taskDate) {
        await editTask(taskDate, task.id, {
          name: title,
          category: effectiveCategory,
          status,
          time: timeSlot,
          assignedTo,
          notes,
        });
      } else {
        await Promise.all(
          selectedDates.map(date =>
            addTask(date, effectiveCategory, title, timeSlot, { assignedTo, notes, status })
          )
        );
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !taskDate) return;
    setIsDeleting(true);
    try {
      await removeTask(taskDate, task.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEdit ? 'Edit Task' : 'Add New Task'}
              </h2>
              {taskIdLabel && (
                <p className="text-xs text-slate-400 mt-0.5">Task ID: {taskIdLabel}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Task Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter task title…"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={isCustom ? 'custom' : category}
                onChange={e => {
                  if (e.target.value === 'custom') {
                    setIsCustom(true);
                    setCategory('custom');
                  } else {
                    setIsCustom(false);
                    setCategory(e.target.value);
                    setCustomCat('');
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                {PREDEFINED_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="custom">+ Custom…</option>
              </select>
              {isCustom && (
                <input
                  autoFocus
                  type="text"
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  placeholder="Type category name…"
                  className="mt-2 w-full px-3 py-2 bg-slate-50 border border-primary/40 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Status)}
                className={cn(
                  'w-full px-3 py-2.5 border-none rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                  STATUS_COLORS[status],
                )}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Assigned To
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary pointer-events-none">
                {currentUserName.slice(0, 2).toUpperCase()}
              </div>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
              >
                <option value={currentUserName}>{currentUserName}</option>
              </select>
            </div>
          </div>

          {/* Scheduled Days (add mode only — multi-select) */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Scheduled Days
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDates(
                      selectedDates.length === weekDays.length ? [] : weekDays.map(d => d.id)
                    )
                  }
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  {selectedDates.length === weekDays.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex gap-2">
                {weekDays.map(d => {
                  const active = selectedDates.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        setSelectedDates(prev =>
                          prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id]
                        )
                      }
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-bold transition-all border',
                        active
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-primary/40'
                      )}
                    >
                      {d.label.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              {selectedDates.length === 0 && (
                <p className="text-[11px] text-red-500 mt-1">Select at least one day.</p>
              )}
            </div>
          )}

          {/* Time Window */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Time Window
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={timeStart}
                onChange={e => setTimeStart(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <span className="text-slate-400 text-sm font-medium shrink-0">to</span>
              <input
                type="time"
                value={timeEnd}
                onChange={e => setTimeEnd(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Notes &amp; Special Requirements
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes or special requirements…"
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          {isEdit ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting…' : 'Delete Task'}
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || (!isEdit && selectedDates.length === 0)}
              className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
