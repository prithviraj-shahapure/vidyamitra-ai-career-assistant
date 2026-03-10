import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, FileText, Mic, RefreshCw, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import MarketInsights from '../components/MarketInsights';

type ProgressSummaryResponse = {
  best_resume: number;
  training_progress: {
    completed: number;
    total: number;
    milestone: string;
    role: string;
  };
  avg_quiz: number;
  total_activities: number;
};

const REFRESH_INTERVAL_MS = 20000;

const actionLinks = [
  {
    title: 'Refine your resume',
    description: 'Upload the latest version and catch missing keywords.',
    to: '/resume',
    icon: FileText,
  },
  {
    title: 'Continue the plan',
    description: 'Push your learning roadmap one milestone further.',
    to: '/plan',
    icon: BookOpenCheck,
  },
  {
    title: 'Practice speaking',
    description: 'Run a mock interview and build response confidence.',
    to: '/interview',
    icon: Mic,
  },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummaryResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSummary = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get<ProgressSummaryResponse>('/progress/summary');
      setSummary(res.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Dashboard Error:', err);
      setError('Failed to load dashboard data. Your session may have expired, please log in again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary(false);
    const id = setInterval(() => {
      void fetchSummary(true);
    }, REFRESH_INTERVAL_MS);

    const handleProgressUpdated = () => {
      void fetchSummary(true);
    };

    window.addEventListener('progress-updated', handleProgressUpdated);

    return () => {
      clearInterval(id);
      window.removeEventListener('progress-updated', handleProgressUpdated);
    };
  }, [fetchSummary]);

  const metrics = useMemo(() => {
    const resume = summary?.best_resume ?? 0;
    const completed = summary?.training_progress?.completed ?? 0;
    const total = Math.max(summary?.training_progress?.total ?? 10, 1);
    const quiz = summary?.avg_quiz ?? 0;
    const attempts = summary?.total_activities ?? 0;
    const nextMilestone = summary?.training_progress?.milestone ?? 'Start your journey';
    const role = summary?.training_progress?.role ?? 'Technology';
    const progressPct = Math.round((completed / total) * 100);
    const readiness = Math.round((resume + quiz + progressPct) / 3);

    return {
      resume,
      completed,
      total,
      quiz,
      attempts,
      nextMilestone,
      role,
      progressPct,
      readiness,
    };
  }, [summary]);

  const syncLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Waiting for first sync';

  const renderLoading = () => <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />;

  return (
    <div className="page-wrap space-y-8">
      <section className="page-header">
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.95fr] xl:items-center">
          <div>
            <span className="hero-kicker">Career command center</span>
            <h1 className="page-title mt-5">See your whole career journey without losing the human feel.</h1>
            <p className="page-subtitle">
              Resume strength, learning momentum, quiz confidence, and market context now live in a calmer workspace built to
              help you focus on the next meaningful step.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="chip chip-brand">
                <Target className="h-3.5 w-3.5" />
                Focus role: {metrics.role}
              </span>
              <span className="chip chip-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Next milestone: {metrics.nextMilestone}
              </span>
              <span className="chip chip-neutral">Last sync: {syncLabel}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/plan" className="btn-primary">
                Continue training
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/quiz" className="btn-secondary">Take a quiz</Link>
              <button onClick={() => void fetchSummary(true)} className="btn-secondary">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="surface-card p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Readiness index</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-extrabold text-stone-900">{loading ? '--' : metrics.readiness}</span>
                <span className="pb-2 text-sm font-semibold text-stone-400">/100</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">A blended signal from your resume score, quiz average, and roadmap completion.</p>
            </article>

            <article className="surface-card p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Activities logged</p>
              <div className="mt-4 flex items-center gap-3">
                {loading ? renderLoading() : <span className="text-5xl font-extrabold text-stone-900">{metrics.attempts}</span>}
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">Every quiz, resume upload, plan update, and interview contributes to your history.</p>
            </article>
          </div>
        </div>
      </section>

      {error && <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Learning momentum</p>
              <h2 className="mt-2 text-3xl font-extrabold text-stone-900">{metrics.completed} of {metrics.total} modules complete</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Stay consistent rather than perfect. Each small completion raises both confidence and clarity.</p>
            </div>
            <div className="rounded-[24px] bg-orange-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Progress</p>
              <p className="mt-1 text-2xl font-extrabold text-orange-800">{loading ? '--' : `${metrics.progressPct}%`}</p>
            </div>
          </div>

          <div className="mt-6 progress-track">
            <div className="progress-fill transition-all duration-700" style={{ width: `${loading ? 0 : metrics.progressPct}%` }} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="surface-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Resume match</p>
              <p className="mt-2 text-2xl font-extrabold text-stone-900">{loading ? '--' : metrics.resume}<span className="text-base text-stone-400">/100</span></p>
            </div>
            <div className="surface-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Quiz average</p>
              <p className="mt-2 text-2xl font-extrabold text-teal-700">{loading ? '--' : `${metrics.quiz}%`}</p>
            </div>
            <div className="surface-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Trajectory</p>
              <p className="mt-2 text-2xl font-extrabold text-orange-700">{loading ? '--' : metrics.progressPct >= 70 ? 'Strong' : 'Building'}</p>
            </div>
          </div>
        </article>

        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-teal-50 text-teal-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Right now</p>
              <h2 className="text-2xl font-extrabold text-stone-900">What deserves attention next?</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {actionLinks.map((item) => (
              <Link key={item.title} to={item.to} className="surface-card-soft interactive-card flex items-start gap-4 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/80 text-orange-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-400" />
              </Link>
            ))}
          </div>
        </article>
      </section>

      <MarketInsights domain={metrics.role} />
    </div>
  );
}
