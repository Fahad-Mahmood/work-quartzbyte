import { useState, useEffect } from 'react';
import { Users, ArrowUpDown, MailCheck, Loader2, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useUserProfile } from '@/src/context/ProfileContext';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { cn, formatTimeSlot } from '@/src/lib/utils';
import { startOfWeek, addDays, format, addWeeks } from 'date-fns';

interface Member {
  id: string;
  user_id: string;
  full_name: string | null;
  job_title: string | null;
  avatar_url: string | null;
  role: string;
  email: string | null;
  created_at: string;
}

interface PendingInvite {
  id: string;
  email: string;
  full_name: string;
  job_title: string;
  role: string;
  invited_by: string | null;
  created_at: string;
}

interface Task {
  id: string;
  name: string;
  category: string;
  time_slot: string;
  status: string;
  notes: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  Completed:    'bg-green-100 text-green-700',
  'In Progress':'bg-blue-100 text-blue-700',
  Pending:      'bg-surface-container-high text-on-surface-variant',
  Overdue:      'bg-red-100 text-red-500',
};

const CAT_COLORS: Record<string, string> = {
  Recording:     'bg-primary/10 text-primary',
  'Cold Calling':'bg-secondary-container text-secondary',
  Learning:      'bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant',
  Internal:      'bg-surface-container-high text-on-surface-variant',
};

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarBg(name: string | null) {
  const colors = [
    'bg-primary/20 text-primary',
    'bg-secondary-container text-secondary',
    'bg-tertiary-fixed-dim/50 text-on-tertiary-fixed-variant',
    'bg-error-container text-on-error-container',
  ];
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
}

function ScheduleModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const start = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), weekOffset);
  const weekDays = Array.from({ length: 5 }).map((_, i) => {
    const date = addDays(start, i);
    return { id: format(date, 'yyyy-MM-dd'), label: format(date, 'EEE'), dateStr: format(date, 'MMM d') };
  });

  useEffect(() => {
    if (!supabase) { setIsLoading(false); return; }
    setIsLoading(true);
    const dateIds = weekDays.map(d => d.id);
    supabase
      .from('work_tasks')
      .select('id, name, category, time_slot, status, notes, date')
      .eq('user_id', member.user_id)
      .in('date', dateIds)
      .order('time_slot', { ascending: true })
      .then(({ data }) => {
        const grouped: Record<string, Task[]> = {};
        dateIds.forEach(d => { grouped[d] = []; });
        (data ?? []).forEach((t: any) => {
          if (grouped[t.date]) grouped[t.date].push(t);
        });
        setTasksByDate(grouped);
        setIsLoading(false);
      });
  }, [member.user_id, weekOffset]);

  const totalTasks = Object.values(tasksByDate).flat().length;
  const dateRangeStr = `${format(start, 'MMM d')} – ${format(addDays(start, 4), 'MMM d, yyyy')}`;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0', getAvatarBg(member.full_name))}>
                {getInitials(member.full_name)}
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{member.full_name}</p>
                <p className="text-xs text-on-surface-variant">{member.job_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Week nav */}
              <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg text-on-surface-variant text-xs font-bold">
                <button onClick={() => setWeekOffset(o => o - 1)} className="hover:text-primary p-0.5">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2">{dateRangeStr}</span>
                <button onClick={() => setWeekOffset(o => o + 1)} className="hover:text-primary p-0.5">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Schedule content */}
          <div className="overflow-y-auto flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : totalTasks === 0 ? (
              <div className="text-center py-16">
                <Calendar className="h-12 w-12 text-on-surface-variant/20 mx-auto mb-3" />
                <p className="font-bold text-on-surface">No tasks this week</p>
                <p className="text-sm text-on-surface-variant mt-1">{member.full_name} has no scheduled tasks for this period.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {weekDays.map(day => {
                  const tasks = tasksByDate[day.id] ?? [];
                  return (
                    <div key={day.id} className="flex flex-col gap-2">
                      <div className="text-center pb-2 border-b border-outline-variant/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{day.label}</p>
                        <p className="text-sm font-extrabold text-on-surface font-headline">{day.dateStr}</p>
                        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                      </div>
                      {tasks.length === 0 ? (
                        <p className="text-xs text-on-surface-variant/40 text-center py-4">—</p>
                      ) : (
                        tasks.map(task => (
                          <div key={task.id} className="bg-surface-container rounded-xl p-3 space-y-1.5">
                            <p className="text-xs font-bold text-on-surface leading-snug">{task.name}</p>
                            <p className="text-[10px] text-on-surface-variant">{formatTimeSlot(task.time_slot)}</p>
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider', CAT_COLORS[task.category] ?? 'bg-slate-100 text-slate-600')}>
                                {task.category}
                              </span>
                              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', STATUS_STYLES[task.status] ?? STATUS_STYLES['Pending'])}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-outline-variant/10 bg-surface-container-lowest/60 shrink-0">
            <p className="text-xs text-on-surface-variant">
              <span className="font-bold text-on-surface">{totalTasks}</span> task{totalTasks !== 1 ? 's' : ''} scheduled this week
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function TeamPage() {
  usePageTitle('Team');
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();

  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortByRole, setSortByRole] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resentId, setResentId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Member | null>(null);

  useEffect(() => {
    if (!supabase) { setIsLoading(false); return; }

    Promise.all([
      supabase.from('work_profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('work_invitations').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]).then(([profilesRes, invitesRes]) => {
      const profilesList = (profilesRes.data as Member[]) ?? [];
      const invitesList = (invitesRes.data as PendingInvite[]) ?? [];

      const activeEmails = new Set(profilesList.map(m => m.email?.toLowerCase()).filter(Boolean));
      const filteredInvites = invitesList.filter(i => !activeEmails.has(i.email?.toLowerCase()));

      setMembers(profilesList);
      setPending(filteredInvites);
      setIsLoading(false);
    });
  }, []);

  const handleResend = async (invite: PendingInvite) => {
    if (!supabase) return;
    setResendingId(invite.id);
    setResendError(null);
    try {
      const res = await supabase.functions.invoke('invite-member', {
        body: {
          email:      invite.email,
          full_name:  invite.full_name,
          job_title:  invite.job_title,
          role:       invite.role,
          invited_by: invite.invited_by,
        },
      });
      const errMsg = res.error?.message ?? res.data?.error;
      if (errMsg) {
        setResendError(errMsg);
      } else {
        setResentId(invite.id);
        setTimeout(() => setResentId(null), 3000);
      }
    } catch (e: any) {
      setResendError(e.message);
    } finally {
      setResendingId(null);
    }
  };

  const sorted = sortByRole
    ? [...members].sort((a, b) => {
        if (a.role === b.role) return 0;
        return a.role === 'admin' ? -1 : 1;
      })
    : members;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const totalCount = members.length + pending.length;

  return (
    <div className="flex flex-col gap-6 max-w-[1100px] mx-auto animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Quartzbyte Operations</p>
          <h1 className="text-3xl sm:text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Team Directory</h1>
          <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">
            A curated ledger of specialized talent across the Quartzbyte internal pipeline.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-stretch rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-container-lowest shrink-0 w-full md:w-auto">
          <div className="flex-1 md:flex-none px-5 md:px-8 py-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1">Total Staff</p>
            <p className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">{totalCount}</p>
          </div>
          <div className="w-px bg-primary/30 my-3" />
          <div className="flex-1 md:flex-none px-5 md:px-8 py-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1">Admins</p>
            <p className="text-2xl md:text-3xl font-headline font-extrabold text-primary">
              {members.filter(m => m.role === 'admin').length}
            </p>
          </div>
          {pending.length > 0 && (
            <>
              <div className="w-px bg-primary/30 my-3" />
              <div className="flex-1 md:flex-none px-5 md:px-8 py-4 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1">Pending</p>
                <p className="text-2xl md:text-3xl font-headline font-extrabold text-amber-500">{pending.length}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="flex justify-end">
        <button
          onClick={() => setSortByRole(s => !s)}
          className={cn(
            'flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border transition-all',
            sortByRole
              ? 'bg-primary text-white border-primary'
              : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low'
          )}
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort by Role
        </button>
      </div>

      {/* Resend error */}
      {resendError && (
        <div className="px-4 py-3 bg-error-container text-on-error-container text-sm font-medium rounded-xl">
          Failed to resend invite: {resendError}
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/10">
          <Users className="h-12 w-12 text-on-surface-variant/30 mx-auto mb-4" />
          <p className="font-headline font-bold text-lg text-on-surface">No members yet</p>
          <p className="text-on-surface-variant text-sm mt-1">Add members via the Add Member page.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">

          {/* Desktop header row */}
          <div className="hidden md:grid grid-cols-[1fr_130px_1fr_130px_180px] gap-4 px-8 py-3 bg-surface-container border-b border-outline-variant/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Member</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Role</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</span>
          </div>

          <div className="divide-y divide-outline-variant/10">
            {/* Active members */}
            {sorted.map(member => {
              const isCurrentUser = member.user_id === user?.id;

              return (
                <div key={member.id} className="hover:bg-surface-container-high/40 transition-colors">

                  {/* Mobile card */}
                  <div className="flex md:hidden items-start gap-4 px-5 py-4">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name ?? ''} className="w-11 h-11 rounded-full object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className={cn('w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5', getAvatarBg(member.full_name))}>
                        {getInitials(member.full_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-on-surface text-sm leading-tight">{member.full_name ?? '—'}</p>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">You</span>
                        )}
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider',
                          member.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                        )}>{member.role}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{member.job_title ?? '—'}</p>
                      <p className="text-xs text-on-surface-variant/70 mt-1 truncate">{member.email ?? '—'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-xs font-semibold text-on-surface">Active</span>
                        </div>
                        <button
                          onClick={() => setScheduleTarget(member)}
                          className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                        >
                          <Calendar className="h-3.5 w-3.5" /> View Schedule
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[1fr_130px_1fr_130px_180px] gap-4 px-8 py-5 items-center">
                    <div className="flex items-center gap-4">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name ?? ''} className="w-11 h-11 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className={cn('w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0', getAvatarBg(member.full_name))}>
                          {getInitials(member.full_name)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-on-surface text-sm leading-tight">
                          {member.full_name ?? '—'}
                          {isCurrentUser && (
                            <span className="ml-2 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">You</span>
                          )}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{member.job_title ?? '—'}</p>
                      </div>
                    </div>
                    <div>
                      <span className={cn(
                        'px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider',
                        member.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                      )}>{member.role}</span>
                    </div>
                    <div className="text-sm text-on-surface-variant font-medium truncate">{member.email ?? '—'}</div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="text-sm font-semibold text-on-surface">Active</span>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setScheduleTarget(member)}
                        className="flex items-center gap-1.5 text-primary text-sm font-bold hover:underline"
                      >
                        <Calendar className="h-4 w-4" /> View Schedule
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pending invites */}
            {pending.map(invite => (
              <div key={invite.id} className="bg-amber-50/40 hover:bg-amber-50/60 transition-colors">

                {/* Mobile card */}
                <div className="flex md:hidden items-start gap-4 px-5 py-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5 bg-amber-100 text-amber-600 border-2 border-dashed border-amber-300">
                    {getInitials(invite.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-on-surface text-sm">{invite.full_name}</p>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider',
                        invite.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                      )}>{invite.role}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{invite.job_title}</p>
                    <p className="text-xs text-on-surface-variant/70 mt-1 truncate">{invite.email}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-xs font-semibold text-amber-600">Pending</span>
                      </div>
                      {isAdmin && (
                        resentId === invite.id ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                            <MailCheck className="h-3.5 w-3.5" /> Sent!
                          </span>
                        ) : (
                          <button
                            onClick={() => handleResend(invite)}
                            disabled={resendingId === invite.id}
                            className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            {resendingId === invite.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <MailCheck className="h-3 w-3" />}
                            Resend
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[1fr_130px_1fr_130px_180px] gap-4 px-8 py-5 items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 bg-amber-100 text-amber-600 border-2 border-dashed border-amber-300">
                      {getInitials(invite.full_name)}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm leading-tight">{invite.full_name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{invite.job_title}</p>
                    </div>
                  </div>
                  <div>
                    <span className={cn(
                      'px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider',
                      invite.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                    )}>{invite.role}</span>
                  </div>
                  <div className="text-sm text-on-surface-variant font-medium truncate">{invite.email}</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-sm font-semibold text-amber-600">Pending</span>
                  </div>
                  <div className="flex justify-end">
                    {isAdmin ? (
                      resentId === invite.id ? (
                        <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                          <MailCheck className="h-4 w-4" /> Sent!
                        </span>
                      ) : (
                        <button
                          onClick={() => handleResend(invite)}
                          disabled={resendingId === invite.id}
                          className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {resendingId === invite.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />}
                          Resend Invite
                        </button>
                      )
                    ) : (
                      <span className="text-on-surface-variant/40 text-xs font-bold">Invited</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 md:px-8 py-4 border-t border-outline-variant/10 bg-surface-container-lowest/60">
            <p className="text-xs text-on-surface-variant font-medium">
              Showing <span className="font-bold text-on-surface">{sorted.length}</span> active member{sorted.length !== 1 ? 's' : ''}
              {pending.length > 0 && (
                <>, <span className="font-bold text-amber-500">{pending.length}</span> pending invite{pending.length !== 1 ? 's' : ''}</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {scheduleTarget && (
        <ScheduleModal member={scheduleTarget} onClose={() => setScheduleTarget(null)} />
      )}
    </div>
  );
}
