import { useState, useEffect, useRef } from 'react';
import { User, Lock, Shield, CheckCircle, Upload } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { cn } from '@/src/lib/utils';

interface Profile {
  full_name: string;
  job_title: string;
  avatar_url: string | null;
}

export function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile]       = useState<Profile>({ full_name: '', job_title: '', avatar_url: null });
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Derive display values
  const initials = (profile.full_name || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const lastLogin = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  // Fetch profile on mount
  useEffect(() => {
    const load = async () => {
      if (!supabase || !user) { setIsLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('work_profiles')
          .select('full_name, job_title, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setProfile({
            full_name:  data.full_name  ?? '',
            job_title:  data.job_title  ?? '',
            avatar_url: data.avatar_url ?? null,
          });
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!supabase || !user) return;
    setIsSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('work_profiles')
        .upsert({
          user_id:    user.id,
          full_name:  profile.full_name,
          job_title:  profile.job_title,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !user) return;

    // Validate
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const path = `${user.id}/avatar.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Bust cache
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setProfile(p => ({ ...p, avatar_url: url }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight mb-1">
          Account Settings
        </h2>
        <p className="text-on-surface-variant font-medium text-sm">
          Manage your internal identity within the operations hub.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-error-container text-on-error-container text-sm font-medium rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left column ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Avatar card */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10 flex flex-col items-center text-center">
            <div
              className="relative group cursor-pointer mb-6"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-32 h-32 rounded-full overflow-hidden bg-surface-container-high border-4 border-white shadow-md transition-transform group-hover:scale-105">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold font-headline">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                  {isUploading
                    ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    : <Upload className="h-6 w-6 text-white" />
                  }
                </div>
              </div>
              <button
                type="button"
                className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white"
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
            </div>

            <h3 className="text-on-surface font-bold text-lg mb-0.5">
              {profile.full_name || 'Your Name'}
            </h3>
            <p className="text-on-surface-variant text-sm mb-6">{user?.email}</p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-container-low text-primary text-sm font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading…' : 'Upload New Photo'}
            </button>
            <p className="mt-3 text-[11px] text-on-surface-variant">
              JPG, PNG or WebP · max 2 MB
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Form card */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
            <h4 className="text-primary font-bold text-lg mb-6 flex items-center gap-2">
              <User className="h-5 w-5" />
              General Information
            </h4>

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 px-4 text-on-surface font-medium transition-all outline-none text-sm"
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={profile.job_title}
                  onChange={e => setProfile(p => ({ ...p, job_title: e.target.value }))}
                  placeholder="e.g. Operations Lead"
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 px-4 text-on-surface font-medium transition-all outline-none text-sm"
                />
              </div>

              {/* Email — read only */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="w-full bg-surface-dim/40 border-none rounded-xl py-3 px-4 pr-10 text-on-surface-variant font-medium cursor-not-allowed text-sm"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-6 mt-6 border-t border-outline-variant/15 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProfile(p => ({ ...p }))}
                className="px-6 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  'px-8 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
                  saved
                    ? 'bg-tertiary-fixed-dim text-on-tertiary-fixed'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50',
                )}
              >
                {saved
                  ? <><CheckCircle className="h-4 w-4" /> Saved</>
                  : isSaving ? 'Saving…' : 'Save Changes'
                }
              </button>
            </div>
          </div>

          {/* Security insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed/40 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Last Login</p>
                <p className="text-sm font-bold text-on-surface mt-0.5">{lastLogin}</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-fixed/40 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-on-tertiary-fixed-variant" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Account Status</p>
                <p className="text-sm font-bold text-on-tertiary-fixed-variant mt-0.5">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
