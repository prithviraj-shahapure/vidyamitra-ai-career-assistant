import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { AlertCircle, BookOpen, CheckCircle, History, Loader2, PlayCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import VisualAids from '../components/VisualAids';

type PlanResponse = {
  source_table?: string;
  id: string | number;
  completed_modules: number;
  total_modules: number;
  current_milestone: string;
  role?: string;
  created_at?: string;
};

type Video = {
  id: string;
  title: string;
  thumbnail?: string;
  thumbnail_url?: string;
  image?: string;
  channel?: string;
};

const PLAN_STORAGE_KEY = 'vidyamitra_plan_state_v1';

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const isPersistedPlanId = (value: unknown, historyItems: PlanResponse[]) => {
  const idText = String(value ?? '').trim();
  if (!idText || idText.startsWith('tmp-plan-')) return false;
  if (isUuid(idText) || /^\d+$/.test(idText)) return true;

  return historyItems.some((item) => String(item.id) === idText);
};

const normalizePlan = (item: any): PlanResponse => {
  const totalModules = Math.max(1, toNumber(item?.total_modules ?? item?.total ?? item?.modules, 8));
  const completedModules = Math.min(Math.max(0, toNumber(item?.completed_modules ?? item?.completed ?? 0, 0)), totalModules);
  const milestone = String(
    item?.current_milestone ??
      item?.nextMilestone ??
      item?.milestone ??
      item?.title ??
      item?.name ??
      item?.topic ??
      'Continue Learning',
  );

  const fallbackId = `tmp-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const planId = item?.id ?? item?.plan_id ?? fallbackId;

  return {
    id: planId,
    completed_modules: completedModules,
    total_modules: totalModules,
    current_milestone: milestone,
    role: item?.role ?? item?.job_role ?? undefined,
    created_at: item?.created_at ? String(item.created_at) : undefined,
    source_table: item?.source_table ? String(item.source_table) : undefined,
  };
};

const normalizeVideo = (item: any, idx: number): Video => {
  const id = String(item?.id || item?.videoId || item?.video_id || `fallback-${idx + 1}`);
  return {
    id,
    title: String(item?.title || `Tutorial ${idx + 1}`),
    thumbnail: item?.thumbnail || item?.thumbnail_url || item?.image || (id.startsWith('fallback-') ? undefined : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`),
    thumbnail_url: item?.thumbnail_url,
    image: item?.image,
    channel: item?.channel,
  };
};

export default function Plan() {
  const location = useLocation();
  const [jobRole, setJobRole] = useState('');
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [history, setHistory] = useState<PlanResponse[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isVideosLoading, setIsVideosLoading] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async (topic: string) => {
    if (!topic) return;

    setIsVideosLoading(true);
    try {
      const vidRes = await api.get(`/learning/videos?topic=${encodeURIComponent(topic)}`);
      setVideos(Array.isArray(vidRes.data?.videos) ? vidRes.data.videos.map((v: any, idx: number) => normalizeVideo(v, idx)) : []);
    } catch (e) {
      console.error('Failed to load videos', e);
      setVideos([]);
    } finally {
      setIsVideosLoading(false);
    }
  };

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await api.get('/plan/history');
      const list = Array.isArray(res.data?.history) ? res.data.history : [];
      const normalized = list.map((item: any) => normalizePlan(item));
      setHistory(normalized);

      if (normalized.length > 0) {
        const latest = normalized[0];
        setPlan((prev) => prev || latest);
      } else {
        setPlan(null);
      }
    } catch (e: any) {
      console.error('Failed to load plan history', e);
      setError(e?.response?.data?.detail || 'Could not load your plan history. Please try again.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    const selectedRole = (location.state as { selectedRole?: string } | null)?.selectedRole;

    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.plan) setPlan(normalizePlan(parsed.plan));
        if (Array.isArray(parsed.videos)) setVideos(parsed.videos.map((v: any, idx: number) => normalizeVideo(v, idx)));
      } catch {
        // ignore storage corruption
      }
    }

    if (selectedRole) {
      setJobRole(selectedRole);
    }

    void loadHistory();
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem(
      PLAN_STORAGE_KEY,
      JSON.stringify({
        plan,
        videos,
      }),
    );
  }, [plan, videos]);

  useEffect(() => {
    if (plan && videos.length === 0) {
      void fetchVideos(plan.current_milestone);
    }
  }, [plan, videos.length]);

  const ensurePersistedPlanId = async (inputPlan: PlanResponse) => {
    const idText = String(inputPlan.id || '');
    if (isPersistedPlanId(idText, history)) return idText;

    const saveRes = await api.post('/plan/save', {
      role: inputPlan.role || jobRole || 'Technology',
      current_milestone: inputPlan.current_milestone,
      total_modules: inputPlan.total_modules,
      completed_modules: inputPlan.completed_modules,
    });

    const persistedId = String(saveRes.data?.plan_id || '');
    if (!persistedId) {
      throw new Error('Failed to persist plan before completing module.');
    }

    setPlan((prev) => (prev ? { ...prev, id: persistedId } : prev));

    return persistedId;
  };

  const generatePath = async () => {
    if (!jobRole.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const planRes = await api.get(`/plan?role=${encodeURIComponent(jobRole)}`);
      const normalizedPlan = normalizePlan({ ...planRes.data, role: jobRole });

      const saveRes = await api.post('/plan/save', {
        role: jobRole,
        current_milestone: normalizedPlan.current_milestone,
        total_modules: normalizedPlan.total_modules,
        completed_modules: normalizedPlan.completed_modules,
      });

      normalizedPlan.id = saveRes.data?.plan_id || normalizedPlan.id;
      setPlan(normalizedPlan);
      window.dispatchEvent(new Event('progress-updated'));

      await Promise.all([fetchVideos(normalizedPlan.current_milestone), loadHistory()]);
      setJobRole('');
    } catch (err: any) {
      console.error('Path generation failed', err);
      setError(err?.response?.data?.detail || 'Could not generate training plan right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = async () => {
    if (!plan) return;
    setIsCompleting(true);
    setError(null);

    try {
      const planId = await ensurePersistedPlanId(plan);
      const res = await api.post(`/plan/complete-module/${planId}`);
      const completed = toNumber(res.data?.total_completed, plan.completed_modules + 1);

      setPlan((prev) => (prev ? { ...prev, completed_modules: completed } : prev));
      window.dispatchEvent(new Event('progress-updated'));
      await loadHistory();
    } catch (err: any) {
      console.error('Update failed', err);
      setError(err?.response?.data?.detail || 'Could not update module progress.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDeletePlan = async (item: PlanResponse) => {
    const planId = String(item.id ?? '').trim();
    if (!planId) {
      setError('Invalid plan id. Please refresh and try again.');
      return;
    }

    const confirmed = window.confirm('Delete this previous plan from history?');
    if (!confirmed) return;

    const deletingKey = `${item.source_table || 'any'}:${planId}`;
    const previousHistory = history;

    setDeletingPlanId(deletingKey);
    setError(null);
    setHistory((prev) => prev.filter((entry) => !(String(entry.id) === planId && (entry.source_table || '') === (item.source_table || ''))));

    const deletingCurrent = plan
      ? String(plan.id) === planId && (plan.source_table || '') === (item.source_table || '')
      : false;

    if (deletingCurrent) {
      setPlan(null);
      setVideos([]);
    }

    try {
      await api.delete(`/plan/history/${encodeURIComponent(planId)}`, {
        params: {
          ...(item.source_table ? { table: item.source_table } : {}),
          ...(item.created_at ? { created_at: item.created_at } : {}),
          milestone: item.current_milestone,
          ...(item.role ? { role: item.role } : {}),
        },
      });
      await loadHistory();
      window.dispatchEvent(new Event('progress-updated'));
    } catch (err: any) {
      console.error('Failed to delete plan history', err);
      setError(err?.response?.data?.detail || 'Could not delete this plan history item.');
      setHistory(previousHistory);
      if (deletingCurrent) setPlan(item);
    } finally {
      setDeletingPlanId(null);
    }
  };

  const loadPlanFromHistory = async (item: PlanResponse) => {
    setPlan(item);
    setError(null);
    await fetchVideos(item.current_milestone);
  };

  const progressPct = useMemo(
    () => (plan ? Math.round((plan.completed_modules / Math.max(plan.total_modules, 1)) * 100) : 0),
    [plan],
  );

  const modulesLeft = plan ? Math.max(plan.total_modules - plan.completed_modules, 0) : 0;

  return (
    <div className="page-wrap space-y-8">
      <section className="page-header">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <span className="hero-kicker">Learning plan</span>
            <h1 className="page-title mt-5">Build a roadmap that feels guided, not generic.</h1>
            <p className="page-subtitle">
              Choose a role, generate the next milestone, save your plan history, and keep your learning materials close to the plan itself.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Saved plans</p>
              <p className="mt-2 text-3xl font-extrabold text-stone-900">{history.length}</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Current focus</p>
              <p className="mt-2 text-lg font-bold text-stone-900">{plan?.role || 'Choose a role'}</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Milestone state</p>
              <p className="mt-2 text-lg font-bold text-stone-900">{plan ? `${progressPct}% complete` : 'Waiting to build'}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-orange-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Generate a new path</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-stone-600">Type a role you want to grow into, and the current backend plan generator will fill in the milestone for you.</p>
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              placeholder="e.g. Frontend Developer"
              className="field flex-1"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={generatePath} disabled={isGenerating || !jobRole.trim()} className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-55 md:flex-none">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Build my path'}
              </button>
              <button onClick={generatePath} disabled={isGenerating || !jobRole.trim()} className="btn-secondary h-[50px] w-[50px] px-0 disabled:cursor-not-allowed disabled:opacity-55" title="Refresh recommendations">
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="surface-card-soft p-4 text-sm leading-6 text-stone-600">Keep the role specific. “Frontend Developer” will give clearer milestones than “software.”</div>
            <div className="surface-card-soft p-4 text-sm leading-6 text-stone-600">Plans are saved so you can compare older paths without changing the backend flow.</div>
          </div>
        </article>

        <article className="surface-card p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Current snapshot</p>
          {plan ? (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm text-stone-500">Role</p>
                <h2 className="mt-1 text-3xl font-extrabold text-stone-900">{plan.role || 'Technology'}</h2>
              </div>
              <div className="rounded-[24px] bg-orange-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Next milestone</p>
                <p className="mt-2 text-lg font-bold text-stone-900">{plan.current_milestone}</p>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
                  <span>{plan.completed_modules}/{plan.total_modules} modules complete</span>
                  <span className="font-bold text-orange-700">{progressPct}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="surface-card-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Modules left</p>
                  <p className="mt-2 text-2xl font-extrabold text-stone-900">{modulesLeft}</p>
                </div>
                <div className="surface-card-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">History entries</p>
                  <p className="mt-2 text-2xl font-extrabold text-stone-900">{history.length}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] bg-white/75 p-6 text-sm leading-7 text-stone-600">
              No active plan yet. Choose a role on the left to generate one and the backend will populate the milestone data here.
            </div>
          )}
        </article>
      </section>

      {(history.length > 0 || isHistoryLoading) && (
        <section className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-teal-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Plan history</h2>
          </div>

          {isHistoryLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-stone-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {history.map((item) => {
                const itemId = String(item.id);
                const itemKey = `${item.source_table || 'any'}:${itemId}`;
                const isDeleting = deletingPlanId === itemKey;
                const isCurrent = plan ? String(plan.id) === itemId : false;

                return (
                  <article key={itemKey} className={`surface-card-soft p-4 ${isCurrent ? 'border-orange-200 bg-orange-50/80' : ''}`}>
                    <button onClick={() => void loadPlanFromHistory(item)} className="w-full text-left" disabled={isDeleting}>
                      <p className="line-clamp-2 font-bold text-stone-900">{item.current_milestone}</p>
                      <p className="mt-2 text-sm text-stone-600">{item.role || 'Technology'} • {item.completed_modules}/{item.total_modules} modules</p>
                    </button>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className={`text-xs font-semibold uppercase tracking-[0.14em] ${isCurrent ? 'text-orange-700' : 'text-stone-500'}`}>
                        {isCurrent ? 'Current plan' : 'Previous plan'}
                      </span>
                      <button
                        onClick={() => void handleDeletePlan(item)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {plan && !isGenerating && (
        <div className="space-y-8">
          <section className="surface-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Active milestone</p>
                <h2 className="mt-2 text-3xl font-extrabold text-stone-900">{plan.current_milestone}</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">Mark the next module complete as soon as you finish it so your progress stays honest and useful.</p>
              </div>
              <button onClick={handleComplete} disabled={isCompleting} className="btn-primary px-6 py-3.5 disabled:opacity-60">
                {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Mark module complete
              </button>
            </div>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <PlayCircle className="h-6 w-6 text-orange-700" />
              <h2 className="text-2xl font-extrabold text-stone-900">Video tutorials</h2>
            </div>

            {isVideosLoading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-stone-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading videos...
              </div>
            ) : videos.length === 0 ? (
              <div className="mt-6 rounded-[24px] bg-white/75 p-5 text-sm text-stone-600">No videos found for this milestone yet. Try refreshing recommendations.</div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((v) => (
                  <a
                    key={v.id}
                    href={`https://youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="interactive-card overflow-hidden rounded-[28px] border border-stone-900/10 bg-white/75 shadow-[0_18px_40px_rgba(86,68,45,0.1)]"
                  >
                    <img
                      src={v.thumbnail || v.thumbnail_url || v.image || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                      alt={v.title || 'Tutorial video thumbnail'}
                      className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                      onError={(e) => {
                        e.currentTarget.src = `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;
                      }}
                    />
                    <div className="p-4">
                      <p className="line-clamp-2 text-sm font-bold text-stone-900">{v.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>

          <VisualAids topic={plan.current_milestone} />
        </div>
      )}
    </div>
  );
}
