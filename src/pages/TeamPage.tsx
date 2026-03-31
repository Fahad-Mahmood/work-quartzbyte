import { useState, useEffect } from 'react';
import { Users, ChevronRight, ArrowUpDown, MailCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useUserProfile } from '@/src/context/ProfileContext';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    if (!supabase) { setIsLoading(false); return; }

    Promise.all([
      supabase.from('work_profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('work_invitations').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]).then(([profilesRes, invitesRes]) => {
      const profilesList = (profilesRes.data as Member[]) ?? [];
      const invitesList = (invitesRes.data as PendingInvite[]) ?? [];

      // Only show invites that haven't accepted yet (email not in work_profiles)
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
      if (!res.error && !res.data?.error) {
        setResentId(invite.id);
        setTimeout(() => setResentId(null), 3000);
      }
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
    <div className="flex flex-col gap-8 max-w-[1100px] mx-auto animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Quartzbyte Operations</p>
          <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Team Directory</h1>
          <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">
            A curated ledger of specialized talent across the Quartzbyte internal pipeline.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-stretch rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-container-lowest shrink-0">
          <div className="px-8 py-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1">Total Staff</p>
            <p className="text-3xl font-headline font-extrabold text-on-surface">{totalCount}</p>
          </div>
          <div className="w-px bg-primary/30 my-3" />
          <div className="px-8 py-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1">Admins</p>
            <p className="text-3xl font-headline font-extrabold text-primary">
              {members.filter(m => m.role === 'admin').length}
            </p>
          </div>
          {pending.length > 0 && (
            <>
              <div className="w-px bg-primary/30 my-3" />
              <div className="px-8 py-4 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-1">Pending</p>
                <p className="text-3xl font-headline font-extrabold text-amber-500">{pending.length}</p>
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

      {/* Table */}
      {totalCount === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/10">
          <Users className="h-12 w-12 text-on-surface-variant/30 mx-auto mb-4" />
          <p className="font-headline font-bold text-lg text-on-surface">No members yet</p>
          <p className="text-on-surface-variant text-sm mt-1">Add members via the Add Member page.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_130px_1fr_130px_160px] gap-4 px-8 py-3 bg-surface-container border-b border-outline-variant/10">
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
                <div
                  key={member.id}
                  className="grid grid-cols-[1fr_130px_1fr_130px_160px] gap-4 px-8 py-5 items-center hover:bg-surface-container-high/40 transition-colors"
                >
                  {/* Member */}
                  <div className="flex items-center gap-4">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name ?? ''}
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
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

                  {/* Role */}
                  <div>
                    <span className={cn(
                      'px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider',
                      member.role === 'admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    )}>
                      {member.role}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="text-sm text-on-surface-variant font-medium truncate">
                    {member.email ?? '—'}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-on-surface">Active</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    {isCurrentUser ? (
                      <Link
                        to="/settings"
                        className="flex items-center gap-1 text-primary text-sm font-bold hover:underline"
                      >
                        Profile <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1 text-on-surface-variant/40 text-sm font-bold cursor-not-allowed select-none">
                        Profile <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pending invites */}
            {pending.map(invite => (
              <div
                key={invite.id}
                className="grid grid-cols-[1fr_130px_1fr_130px_160px] gap-4 px-8 py-5 items-center bg-amber-50/40 hover:bg-amber-50/60 transition-colors"
              >
                {/* Member */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 bg-amber-100 text-amber-600 border-2 border-dashed border-amber-300">
                    {getInitials(invite.full_name)}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm leading-tight">{invite.full_name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{invite.job_title}</p>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <span className={cn(
                    'px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider',
                    invite.role === 'admin'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-container-high text-on-surface-variant'
                  )}>
                    {invite.role}
                  </span>
                </div>

                {/* Email */}
                <div className="text-sm text-on-surface-variant font-medium truncate">
                  {invite.email}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-sm font-semibold text-amber-600">Pending</span>
                </div>

                {/* Actions */}
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
                        {resendingId === invite.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <MailCheck className="h-3.5 w-3.5" />
                        }
                        Resend Invite
                      </button>
                    )
                  ) : (
                    <span className="text-on-surface-variant/40 text-xs font-bold">Invited</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-outline-variant/10 bg-surface-container-lowest/60">
            <p className="text-xs text-on-surface-variant font-medium">
              Showing <span className="font-bold text-on-surface">{sorted.length}</span> active member{sorted.length !== 1 ? 's' : ''}
              {pending.length > 0 && (
                <>, <span className="font-bold text-amber-500">{pending.length}</span> pending invite{pending.length !== 1 ? 's' : ''}</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
