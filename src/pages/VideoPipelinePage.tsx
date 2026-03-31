import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Film, CheckCircle2, Clock, ChevronRight, Clapperboard, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { usePageTitle } from '@/src/hooks/usePageTitle';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export type VideoStatus = 'Drafting' | 'Scripting' | 'Recording' | 'Editing' | 'Reviewing' | 'Approved';

export interface Video {
  id: string;
  user_id: string;
  title: string;
  category: string;
  creator: string | null;
  status: VideoStatus;
  thumbnail_url: string | null;
  drive_link: string | null;
  canva_link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_TABS: Array<VideoStatus | 'All'> = ['All', 'Drafting', 'Scripting', 'Recording', 'Editing', 'Reviewing', 'Approved'];

const STATUS_DOT: Record<VideoStatus, string> = {
  Drafting:  'bg-on-surface-variant/50',
  Scripting: 'bg-blue-400',
  Recording: 'bg-primary',
  Editing:   'bg-purple-400',
  Reviewing: 'bg-amber-400',
  Approved:  'bg-green-500',
};

const STATUS_TEXT: Record<VideoStatus, string> = {
  Drafting:  'text-on-surface-variant',
  Scripting: 'text-blue-600',
  Recording: 'text-primary font-semibold',
  Editing:   'text-purple-600 font-semibold',
  Reviewing: 'text-amber-600',
  Approved:  'text-green-600 font-semibold',
};

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function VideoPipelinePage() {
  usePageTitle('Video Pipeline');
  const { user } = useAuth();

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VideoStatus | 'All'>('All');
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadVideos = async () => {
    if (!supabase) { setIsLoading(false); return; }
    const { data } = await supabase
      .from('work_videos')
      .select('*')
      .order('updated_at', { ascending: false });
    setVideos((data as Video[]) ?? []);
    setIsLoading(false);
  };

  useEffect(() => { loadVideos(); }, [user]);

  const filtered = activeTab === 'All' ? videos : videos.filter(v => v.status === activeTab);
  const inProduction = videos.filter(v => v.status !== 'Approved').length;
  const approvedCount = videos.filter(v => v.status === 'Approved').length;

  const handleCreate = async () => {
    if (!supabase || !user || !newTitle.trim()) return;
    setIsCreating(true);
    const { data } = await supabase.from('work_videos').insert({
      user_id: user.id,
      title: newTitle.trim(),
      category: newCategory.trim() || 'General',
      status: 'Drafting',
    }).select().single();
    setIsCreating(false);
    if (data) {
      setVideos(prev => [data as Video, ...prev]);
      setNewTitle('');
      setNewCategory('');
      setShowNewForm(false);
    }
  };

  const handleDelete = async () => {
    if (!supabase || !deleteTarget) return;
    setIsDeleting(true);
    await supabase.from('work_videos').delete().eq('id', deleteTarget.id);
    setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1100px] mx-auto animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-1">Video Pipeline</h1>
          <p className="text-on-surface-variant text-sm">
            Tracking <span className="font-bold text-on-surface">{videos.length}</span> video{videos.length !== 1 ? 's' : ''} across all stages.
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(v => !v)}
          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create New Video</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Quick-create form */}
      {showNewForm && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Video Title *</label>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. The Science of Deep Sleep"
              className="w-full bg-surface-container border-none focus:ring-2 focus:ring-primary/30 rounded-xl py-2.5 px-4 text-sm font-medium text-on-surface outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</label>
            <input
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="e.g. Sleep Niche"
              className="w-full bg-surface-container border-none focus:ring-2 focus:ring-primary/30 rounded-xl py-2.5 px-4 text-sm font-medium text-on-surface outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowNewForm(false); setNewTitle(''); setNewCategory(''); }}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-bold hover:bg-surface-container-low transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || !newTitle.trim()}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isCreating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Film className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-headline font-extrabold text-on-surface">{inProduction}</p>
            <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium mt-0.5 leading-tight">In Production</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-headline font-extrabold text-on-surface">{approvedCount}</p>
            <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium mt-0.5">Approved</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-headline font-extrabold text-on-surface">{videos.length}</p>
            <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium mt-0.5 leading-tight">Total Videos</p>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant/20 overflow-x-auto scrollbar-hide pb-0">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 transition-all -mb-px',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            {tab}
            {tab !== 'All' && (
              <span className={cn(
                'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold',
                activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
              )}>
                {videos.filter(v => v.status === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Video list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/10">
          <Clapperboard className="h-12 w-12 text-on-surface-variant/20 mx-auto mb-4" />
          <p className="font-headline font-bold text-lg text-on-surface">No videos here yet</p>
          <p className="text-on-surface-variant text-sm mt-1">Create your first video to get started.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">

          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[1fr_140px_160px_160px_120px_80px_40px] gap-4 px-8 py-3 bg-surface-container border-b border-outline-variant/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Video Title</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Creator</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Updated</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Open</span>
            <span />
          </div>

          <div className="divide-y divide-outline-variant/10">
            {filtered.map(video => (
              <div key={video.id} className="group hover:bg-surface-container-high/40 transition-colors">

                {/* Mobile card */}
                <div className="flex md:hidden items-start gap-3 px-4 py-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                    {video.thumbnail_url
                      ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      : <Film className="h-5 w-5 text-on-surface-variant/40" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm leading-snug">{video.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-[9px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                        {video.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[video.status])} />
                        <span className={cn('text-xs', STATUS_TEXT[video.status])}>{video.status}</span>
                      </div>
                    </div>
                    {video.creator && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-extrabold text-primary shrink-0">
                          {getInitials(video.creator)}
                        </div>
                        <span className="text-xs text-on-surface-variant truncate">{video.creator}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-on-surface-variant/60">
                        {formatDistanceToNow(new Date(video.updated_at), { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setDeleteTarget(video)}
                          className="p-1 rounded text-on-surface-variant/40 hover:text-error transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          to={`/video-tracker/${video.id}`}
                          className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                        >
                          Open <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[1fr_140px_160px_160px_120px_80px_40px] gap-4 px-8 py-5 items-center">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                      {video.thumbnail_url
                        ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        : <Film className="h-5 w-5 text-on-surface-variant/40" />
                      }
                    </div>
                    <p className="font-bold text-on-surface text-sm leading-snug truncate">{video.title}</p>
                  </div>
                  <div>
                    <span className="px-2.5 py-1 rounded-lg bg-surface-container text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                      {video.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {video.creator ? (
                      <>
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-extrabold text-primary shrink-0">
                          {getInitials(video.creator)}
                        </div>
                        <span className="text-sm text-on-surface font-medium truncate">{video.creator}</span>
                      </>
                    ) : (
                      <span className="text-sm text-on-surface-variant/40">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[video.status])} />
                    <span className={cn('text-sm', STATUS_TEXT[video.status])}>{video.status}</span>
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    {formatDistanceToNow(new Date(video.updated_at), { addSuffix: true })}
                  </div>
                  <div className="flex justify-end">
                    <Link
                      to={`/video-tracker/${video.id}`}
                      className="flex items-center gap-1 text-primary text-sm font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Open <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setDeleteTarget(video)}
                      className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-error hover:bg-error-container opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 md:px-8 py-4 border-t border-outline-variant/10 bg-surface-container-lowest/60">
            <p className="text-xs text-on-surface-variant font-medium">
              Showing <span className="font-bold text-on-surface">{filtered.length}</span> of{' '}
              <span className="font-bold text-on-surface">{videos.length}</span> video{videos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-error-container flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-error" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-on-surface text-lg">Delete Video?</h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-on-surface mb-8">
                Are you sure you want to delete <span className="font-bold">"{deleteTarget.title}"</span>?
                All associated data will be permanently removed.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-error text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Deleting…' : 'Delete Video'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
