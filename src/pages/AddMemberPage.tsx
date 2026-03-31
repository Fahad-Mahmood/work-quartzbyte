import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { ShieldCheck, User, Info, CheckCircle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useUserProfile } from '@/src/context/ProfileContext';
import { cn } from '@/src/lib/utils';


type Role = 'admin' | 'member';

export function AddMemberPage() {
  usePageTitle('Add Member');
  const { user } = useAuth();
  const { isAdmin, isLoading: profileLoading } = useUserProfile();

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [jobTitle, setJobTitle]   = useState('');
  const [role, setRole]           = useState<Role>('member');
  const [isSaving, setIsSaving]   = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Wait for profile to load before deciding access
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    if (!fullName.trim() || !email.trim() || !jobTitle) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await supabase.functions.invoke('invite-member', {
        body: {
          email:      email.trim().toLowerCase(),
          full_name:  fullName.trim(),
          job_title:  jobTitle,
          role,
          invited_by: user.id,
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      setSuccess(true);
      setFullName('');
      setEmail('');
      setJobTitle('');
      setRole('member');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight mb-1">
          Add New Team Member
        </h2>
        <p className="text-on-surface-variant font-medium text-sm max-w-xl">
          Configure professional credentials and system access levels for new personnel within the Quartzbyte operations hub.
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 px-5 py-4 bg-tertiary-fixed-dim/30 border border-tertiary-fixed-dim rounded-2xl text-on-tertiary-fixed-variant">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">Invitation sent successfully.</p>
            <p className="text-xs mt-0.5">
              An email has been sent to <span className="font-bold">{email || 'the new member'}</span> with a link to set their password and activate their account.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-error-container text-on-error-container text-sm font-medium rounded-xl">
          {error}
        </div>
      )}

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-variant/10">

            {/* Left — Personal Info */}
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Alexander Vance"
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 px-4 text-on-surface font-medium transition-all outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Work Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alexander@quartzbyte.com"
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 px-4 text-on-surface font-medium transition-all outline-none text-sm"
                />
              </div>
            </div>

            {/* Right — Job + Role */}
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Job Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Operations Lead"
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 px-4 text-on-surface font-medium transition-all outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Permission Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['admin', 'member'] as Role[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                        role === r
                          ? 'border-primary bg-white shadow-sm'
                          : 'border-transparent bg-surface-container-low hover:bg-surface-container-high',
                      )}
                    >
                      {r === 'admin'
                        ? <ShieldCheck className={cn('h-5 w-5 mb-1', role === r ? 'text-primary' : 'text-on-surface-variant')} />
                        : <User className={cn('h-5 w-5 mb-1', role === r ? 'text-secondary' : 'text-on-surface-variant')} />
                      }
                      <span className="text-sm font-bold text-on-surface capitalize">{r}</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">
                        {r === 'admin' ? 'Full Control' : 'Standard Access'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Info footer strip */}
          <div className="border-t border-outline-variant/10 bg-surface-container px-8 py-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-on-surface-variant shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              After submitting, share the app URL with the new member and ask them to sign in using their work email. Their access level will be applied automatically.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => { setFullName(''); setEmail(''); setJobTitle(''); setRole('member'); setError(null); setSuccess(false); }}
            className="px-6 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  );
}
