import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  ChevronLeft, ChevronDown, Link as LinkIcon, Save, Film, FileText,
  ShieldCheck, Video, Package, Plus, Trash2, Cloud, Eye, CheckCircle2, XCircle, ExternalLink
} from "lucide-react";
import { cn } from "../lib/utils";

type VideoStatus = 'Drafting' | 'Scripting' | 'Script Review' | 'Recording' | 'Editing' | 'Editing Review' | 'Changes Requested' | 'Approved';

interface SceneRow {
  id: number;
  scene: string;
  take: string;
  notes: string;
  approved: boolean;
}

const CHECKLIST = [
  "Grammar is correct — no spelling or punctuation errors",
  "Language sounds natural and human — not AI-generated",
  "Hook is strong — stops the scroll in first 2 seconds",
  "Body flows logically — each point connects to the next",
  "No filler phrases (e.g. 'In today's video')",
  "WakeUp Better app is mentioned clearly in the CTA",
  "Total word count fits 30–60 sec when spoken aloud",
];

const STATUS_OPTIONS: VideoStatus[] = ['Drafting', 'Scripting', 'Script Review', 'Recording', 'Editing', 'Editing Review', 'Changes Requested', 'Approved'];

const STATUS_COLORS: Record<VideoStatus, { pill: string; dot: string }> = {
  Drafting:            { pill: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30', dot: 'bg-on-surface-variant/40' },
  Scripting:           { pill: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
  'Script Review':     { pill: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
  Recording:           { pill: 'bg-primary/10 text-primary border-primary/20',   dot: 'bg-primary' },
  Editing:             { pill: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  'Editing Review':    { pill: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  'Changes Requested': { pill: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500' },
  Approved:            { pill: 'bg-green-50 text-green-700 border-green-200',    dot: 'bg-green-500' },
};

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

interface MemberSelectProps {
  value: string;
  onChange: (v: string) => void;
  members: { id: string; full_name: string | null; job_title: string | null }[];
  placeholder: string;
}

function MemberSelect({ value, onChange, members, placeholder }: MemberSelectProps) {
  const selected = members.find(m => m.full_name === value);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-on-surface outline-none transition-all cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {members.map(m => (
          <option key={m.id} value={m.full_name ?? ''}>{m.full_name ?? '—'}{m.job_title ? ` — ${m.job_title}` : ''}</option>
        ))}
      </select>
      {/* Avatar / initials overlay */}
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-extrabold text-primary">
        {selected ? getInitials(selected.full_name) : <span className="text-on-surface-variant/40 text-base leading-none">·</span>}
      </div>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant/50" />
    </div>
  );
}

export function VideoTrackerPage() {
  const { id } = useParams();
  const { user } = useAuth();

  // Form state
  const [title, setTitle]                   = useState('');
  const [category, setCategory]             = useState('Social Media Shorts');
  const [creator, setCreator]               = useState('');
  const [editor, setEditor]                 = useState('');
  const [reviewer, setReviewer]             = useState('');
  const [driveLink, setDriveLink]           = useState('');
  const [canvaLink, setCanvaLink]           = useState('');
  const [referenceLink, setReferenceLink]   = useState('');
  const [refViewCount, setRefViewCount]     = useState('');
  const [refVerified, setRefVerified]       = useState<boolean | null>(null);
  const [script, setScript]                 = useState('');
  const [status, setStatus]                 = useState<VideoStatus>('Drafting');
  const [checklist, setChecklist]           = useState<boolean[]>(CHECKLIST.map(() => false));
  const [comments, setComments]             = useState('');
  const [scenes, setScenes]                 = useState<SceneRow[]>([
    { id: 1, scene: '', take: '', notes: '', approved: false },
    { id: 2, scene: '', take: '', notes: '', approved: false },
  ]);
  const [isSaving, setIsSaving]   = useState(false);
  const [savedAt, setSavedAt]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [members, setMembers]     = useState<{ id: string; full_name: string | null; job_title: string | null }[]>([]);

  // Update document title when video title changes
  useEffect(() => {
    document.title = `${title || 'New Video'} — WORK OS`;
    return () => { document.title = 'WORK OS'; };
  }, [title]);

  // Load team members for dropdowns
  useEffect(() => {
    if (!supabase) return;
    supabase.from('work_profiles').select('id, full_name, job_title').order('full_name').then(({ data }) => {
      setMembers(data ?? []);
    });
  }, []);

  // Load video from Supabase when opening an existing video
  useEffect(() => {
    if (!id || !supabase) { setIsLoading(false); return; }
    supabase.from('work_videos').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setTitle(data.title ?? '');
        setCategory(data.category ?? 'Social Media Shorts');
        setCreator(data.creator ?? '');
        setEditor(data.editor ?? '');
        setReviewer(data.reviewer ?? '');
        setStatus((data.status as VideoStatus) ?? 'Drafting');
        setDriveLink(data.drive_link ?? '');
        setCanvaLink(data.canva_link ?? '');
        setReferenceLink(data.reference_link ?? '');
        setRefViewCount(data.ref_view_count ?? '');
        setRefVerified(data.ref_verified ?? null);
        setScript(data.script ?? '');
        setNotes(data.notes ?? '');
        setComments(data.comments ?? '');
        if (data.scenes?.length) setScenes(data.scenes);
        if (data.checklist?.length) setChecklist(data.checklist);
      }
      setIsLoading(false);
    });
  }, [id]);

  const [notes, setNotes] = useState('');

  const addScene = () => {
    setScenes(prev => [...prev, { id: Date.now(), scene: '', take: '', notes: '', approved: false }]);
  };

  const removeScene = (id: number) => {
    setScenes(prev => prev.filter(r => r.id !== id));
  };

  const updateScene = (id: number, field: keyof SceneRow, value: string | boolean) => {
    setScenes(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const toggleCheck = (i: number) => {
    setChecklist(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const handleSave = async () => {
    if (!supabase || !user || !id) return;
    setIsSaving(true);
    const { error } = await supabase.from('work_videos').update({
      title, category, creator, editor, reviewer, status,
      drive_link: driveLink,
      canva_link: canvaLink,
      reference_link: referenceLink,
      ref_view_count: refViewCount,
      ref_verified: refVerified,
      script,
      notes,
      comments,
      scenes,
      checklist,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setIsSaving(false);
    if (error) {
      alert(`Save failed: ${error.message}`);
    } else {
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
    <div className="flex flex-col max-w-5xl mx-auto w-full pb-24 animate-in fade-in duration-500">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 py-3 px-1 mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/video-tracker"
            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors shrink-0"
          >
            <ChevronLeft className="h-4 w-4" /> Pipeline
          </Link>
          <div className="h-4 w-px bg-outline-variant/40" />
          <h2 className="font-headline font-bold text-on-surface text-lg truncate">
            {title || 'New Video'}
          </h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {savedAt && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
              <Cloud className="h-3.5 w-3.5" /> Saved {savedAt}
            </span>
          )}
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(m => !m)}
              className={cn(
                'flex items-center gap-2 pl-3 pr-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all select-none whitespace-nowrap',
                STATUS_COLORS[status].pill
              )}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_COLORS[status].dot)} />
              {status}
              <ChevronDown className={cn('h-3.5 w-3.5 opacity-60 transition-transform', showStatusMenu && 'rotate-180')} />
            </button>
            {showStatusMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/20 py-1.5 w-52 animate-in fade-in slide-in-from-top-1 duration-150">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatus(s); setShowStatusMenu(false); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-surface-container-low transition-colors',
                        s === status ? 'text-on-surface' : 'text-on-surface-variant'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_COLORS[s].dot)} />
                      {s}
                      {s === status && <span className="ml-auto text-primary text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save Video'}
          </button>
        </div>
      </div>

      <div className="space-y-8 px-1">

        {/* Section 1: Video Information */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="px-8 py-5 border-b border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Film className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface text-base">Video Information</h3>
                <p className="text-xs text-on-surface-variant">Core metadata for the production pipeline.</p>
              </div>
            </div>
            {id && (
              <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-wider">
                ID: {id.slice(0, 8).toUpperCase()}
              </span>
            )}
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Video Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. The Science of Deep Sleep"
                className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 px-4 text-sm font-medium text-on-surface outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Production Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 rounded-xl py-3 px-4 text-sm font-medium text-on-surface outline-none appearance-none"
              >
                {['Social Media Shorts', 'Corporate Branding', 'Product Documentation', 'Internal Training', 'Event Coverage', 'Sleep Niche', 'Marketing', 'B2B SaaS'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Content Creator</label>
              <MemberSelect
                value={creator}
                onChange={setCreator}
                members={members}
                placeholder="Select creator…"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Video Editor</label>
              <MemberSelect
                value={editor}
                onChange={setEditor}
                members={members}
                placeholder="Select editor…"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Reviewer</label>
              <MemberSelect
                value={reviewer}
                onChange={setReviewer}
                members={members}
                placeholder="Select reviewer…"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Google Drive Link (Source Assets)</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 pointer-events-none" />
                <input
                  value={driveLink}
                  onChange={e => setDriveLink(e.target.value)}
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-on-surface outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Reference Video Link</label>
              <div className="relative">
                <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 pointer-events-none" />
                <input
                  value={referenceLink}
                  onChange={e => setReferenceLink(e.target.value)}
                  type="url"
                  placeholder="https://www.instagram.com/reel/... or TikTok, YouTube..."
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-on-surface outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-on-surface-variant/60 ml-1">Paste an inspiration reel or reference clip for the creator.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Reference Video Verification */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="bg-amber-500 px-8 py-4 flex items-center gap-3">
            <Eye className="h-5 w-5 text-white" />
            <h3 className="font-headline font-bold text-white uppercase tracking-wide">Reference Video Verification</h3>
            <span className="ml-auto text-[10px] text-white/70 font-bold uppercase tracking-widest">Min. 500K Views Required</span>
          </div>
          <div className="p-8 space-y-6">
            {/* Reference link display */}
            {referenceLink ? (
              <div className="flex items-center gap-3 p-4 bg-surface-container rounded-xl">
                <Video className="h-4 w-4 text-amber-500 shrink-0" />
                <a
                  href={referenceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary font-medium hover:underline truncate flex-1"
                >
                  {referenceLink}
                </a>
                <ExternalLink className="h-4 w-4 text-on-surface-variant/40 shrink-0" />
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant/50 italic">No reference link added yet — add one in Video Information above.</p>
            )}

            {/* View count input + result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  View Count (manually check & enter)
                </label>
                <div className="relative">
                  <Eye className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400 pointer-events-none" />
                  <input
                    value={refViewCount}
                    onChange={e => {
                      setRefViewCount(e.target.value);
                      const n = parseInt(e.target.value.replace(/,/g, ''), 10);
                      setRefVerified(isNaN(n) ? null : n >= 500000);
                    }}
                    placeholder="e.g. 1200000"
                    type="number"
                    min="0"
                    className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-amber-400/40 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-on-surface outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant/60 ml-1">Open the reference link, check the view count, and enter it here.</p>
              </div>

              <div className={cn(
                'flex items-center gap-4 p-5 rounded-2xl border-2 transition-all',
                refVerified === true  ? 'bg-green-50 border-green-200' :
                refVerified === false ? 'bg-red-50 border-red-200' :
                'bg-surface-container border-outline-variant/20'
              )}>
                {refVerified === true && (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                    <div>
                      <p className="font-bold text-green-700 text-sm">Verified ✓</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {parseInt(refViewCount).toLocaleString()} views — meets the 500K minimum.
                      </p>
                    </div>
                  </>
                )}
                {refVerified === false && (
                  <>
                    <XCircle className="h-8 w-8 text-red-400 shrink-0" />
                    <div>
                      <p className="font-bold text-red-600 text-sm">Does Not Qualify</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        {parseInt(refViewCount).toLocaleString()} views — needs 500K+. Choose a different reference.
                      </p>
                    </div>
                  </>
                )}
                {refVerified === null && (
                  <p className="text-sm text-on-surface-variant/50 italic">Enter the view count to verify eligibility.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Video Script */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="bg-primary px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-white/80" />
              <h3 className="font-headline font-bold text-white uppercase tracking-wide">Video Script</h3>
            </div>
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Digital Ledger Format</span>
          </div>

          {/* Script area */}
          <div className="flex min-h-[360px]">
            <div className="w-12 bg-surface-container-low border-r border-outline-variant/20 flex flex-col items-center py-4 gap-[1.15rem] text-[10px] font-mono text-on-surface-variant/40 select-none shrink-0">
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i}>{String(i + 1).padStart(2, '0')}</span>
              ))}
            </div>
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              placeholder="Write full script here — any format, any length. Expand freely…"
              className="flex-1 p-8 text-sm leading-relaxed text-on-surface bg-white resize-none focus:outline-none placeholder:text-on-surface-variant/30"
            />
          </div>
        </section>

        {/* Section 3: Review & Approval Checklist */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="bg-error px-8 py-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-white" />
            <h3 className="font-headline font-bold text-white uppercase tracking-wide">Script Review Checklist — Must be signed off</h3>
          </div>

          <div className="divide-y divide-outline-variant/10">
            <div className="grid grid-cols-[64px_1fr] bg-surface-container border-b border-outline-variant/20">
              <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center border-r border-outline-variant/20">Check</div>
              <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Criteria / Quality Point</div>
            </div>
            {CHECKLIST.map((item, i) => (
              <label key={i} className="grid grid-cols-[64px_1fr] hover:bg-surface-container-high/40 transition-colors cursor-pointer">
                <div className="flex items-center justify-center border-r border-outline-variant/10 py-3">
                  <input
                    type="checkbox"
                    checked={checklist[i]}
                    onChange={() => toggleCheck(i)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                </div>
                <span className={cn("px-6 py-3.5 text-sm transition-colors", checklist[i] ? "line-through text-on-surface-variant/50" : "text-on-surface")}>
                  {item}
                </span>
              </label>
            ))}
          </div>

          <div className="p-6 bg-surface-container-low/40 border-t border-outline-variant/10">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Reviewer Comments</label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Add notes for the creator…"
                rows={2}
                className="w-full bg-white border border-outline-variant/20 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none"
              />
            </div>
          </div>
        </section>

        {/* Section 4: Scene & Take Log */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="bg-secondary-container px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-on-secondary-container" />
              <h3 className="font-headline font-bold text-on-secondary-container uppercase tracking-wide">Scene & Take Log</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-secondary-container/70">Recording Session Entry</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-on-surface text-white text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-3 px-4 w-12 text-center border-r border-white/10">#</th>
                  <th className="py-3 px-4 w-28 border-r border-white/10">Scene</th>
                  <th className="py-3 px-4 w-24 border-r border-white/10">Take #</th>
                  <th className="py-3 px-4 border-r border-white/10">Notes for Editor</th>
                  <th className="py-3 px-4 w-20 text-center border-r border-white/10">Approved</th>
                  <th className="py-3 px-4 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 bg-white">
                {scenes.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="py-2 px-4 text-center text-xs font-bold text-on-surface-variant bg-surface-container-low/50 border-r border-outline-variant/10">{idx + 1}</td>
                    <td className="p-0 border-r border-outline-variant/10">
                      <input
                        value={row.scene}
                        onChange={e => updateScene(row.id, 'scene', e.target.value)}
                        placeholder="SC_01"
                        className="w-full px-3 py-3 text-sm bg-transparent focus:bg-primary/5 focus:outline-none focus:ring-inset focus:ring-1 focus:ring-primary/30"
                      />
                    </td>
                    <td className="p-0 border-r border-outline-variant/10">
                      <input
                        value={row.take}
                        onChange={e => updateScene(row.id, 'take', e.target.value)}
                        placeholder="T-01"
                        className="w-full px-3 py-3 text-sm text-center bg-transparent focus:bg-primary/5 focus:outline-none focus:ring-inset focus:ring-1 focus:ring-primary/30 font-mono"
                      />
                    </td>
                    <td className="p-0 border-r border-outline-variant/10">
                      <textarea
                        value={row.notes}
                        onChange={e => updateScene(row.id, 'notes', e.target.value)}
                        placeholder="Notes for editor…"
                        rows={2}
                        className="w-full px-3 py-2 text-sm bg-transparent focus:bg-primary/5 focus:outline-none resize-none leading-snug"
                      />
                    </td>
                    <td className="py-2 px-4 text-center border-r border-outline-variant/10">
                      <input
                        type="checkbox"
                        checked={row.approved}
                        onChange={e => updateScene(row.id, 'approved', e.target.checked)}
                        className="h-4 w-4 rounded text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => removeScene(row.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error hover:bg-error-container transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-surface-container-low/40 px-6 py-3 border-t border-outline-variant/10 flex items-center justify-between">
            <p className="text-[10px] text-on-surface-variant italic">* Only add approved takes to final edit log.</p>
            <button
              onClick={addScene}
              className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Add Entry Row
            </button>
          </div>
        </section>

        {/* Section 5: Final Assets & Delivery */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="bg-primary-container px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-on-primary-container" />
              <h3 className="font-headline font-bold text-on-primary-container uppercase tracking-wide">Final Assets & Delivery</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container/70">Post-Production</span>
          </div>
          <div className="p-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Canva Final Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 pointer-events-none" />
                <input
                  value={canvaLink}
                  onChange={e => setCanvaLink(e.target.value)}
                  type="url"
                  placeholder="https://www.canva.com/design/..."
                  className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/30 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-on-surface outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-on-surface-variant/60 ml-1">Ensure the design is shared with View or Edit access to the production team.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
