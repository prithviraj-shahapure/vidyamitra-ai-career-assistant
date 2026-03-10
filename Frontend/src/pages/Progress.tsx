import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Clock, RefreshCw, Star, TrendingUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

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

type SkillBar = {
  name: string;
  pct: number;
};

const REFRESH_INTERVAL_MS = 20000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const inferInterviewRank = (compositeScore: number) => {
  if (compositeScore >= 90) return 'Top 5%';
  if (compositeScore >= 80) return 'Top 15%';
  if (compositeScore >= 70) return 'Top 30%';
  if (compositeScore >= 60) return 'Top 45%';
  return 'Top 60%';
};

const buildSkills = (role: string, composite: number): SkillBar[] => {
  const roleName = role.toLowerCase();

  if (roleName.includes('frontend')) {
    return [
      { name: 'React', pct: clamp(composite + 8, 35, 98) },
      { name: 'JavaScript', pct: clamp(composite + 5, 35, 96) },
      { name: 'System Design', pct: clamp(composite - 8, 25, 90) },
      { name: 'Accessibility', pct: clamp(composite - 3, 30, 92) },
    ];
  }

  if (roleName.includes('data')) {
    return [
      { name: 'SQL', pct: clamp(composite + 6, 35, 98) },
      { name: 'Python', pct: clamp(composite + 3, 35, 96) },
      { name: 'Statistics', pct: clamp(composite - 5, 25, 90) },
      { name: 'Data Viz', pct: clamp(composite - 2, 30, 92) },
    ];
  }

  return [
    { name: 'Problem Solving', pct: clamp(composite + 5, 35, 98) },
    { name: 'Communication', pct: clamp(composite - 2, 30, 92) },
    { name: 'System Thinking', pct: clamp(composite - 6, 25, 90) },
    { name: 'Execution', pct: clamp(composite + 1, 30, 95) },
  ];
};

export default function Progress() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ProgressSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get<ProgressSummaryResponse>('/progress/summary');
      setSummary(res.data);
      setError(null);
    } catch (err) {
      console.error('Progress summary error:', err);
      setError('Could not refresh growth data right now. Please try again.');
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

  const computed = useMemo(() => {
    const avgQuiz = summary?.avg_quiz ?? 0;
    const resume = summary?.best_resume ?? 0;
    const completed = summary?.training_progress?.completed ?? 0;
    const total = Math.max(summary?.training_progress?.total ?? 10, 1);
    const role = summary?.training_progress?.role ?? 'Technology';
    const milestone = summary?.training_progress?.milestone ?? 'Start your journey';

    const composite = Math.round((avgQuiz + resume) / 2);
    const hours = (completed * 1.5).toFixed(1);
    const completionPct = Math.round((completed / total) * 100);
    const rank = inferInterviewRank(composite);
    const skills = buildSkills(role, composite);

    return {
      avgQuiz,
      resume,
      completed,
      total,
      role,
      milestone,
      composite,
      hours,
      completionPct,
      rank,
      skills,
    };
  }, [summary]);

  const stats = [
    { label: 'Avg. quiz score', value: `${computed.avgQuiz}%`, icon: Award, color: 'text-teal-700' },
    { label: 'Resume match', value: `${computed.resume}/100`, icon: Zap, color: 'text-orange-700' },
    { label: 'Hours trained', value: `${computed.hours}h`, icon: Clock, color: 'text-stone-700' },
    { label: 'Interview rank', value: computed.rank, icon: Star, color: 'text-amber-700' },
  ];

  const isReadyForInterview = computed.composite >= 70;

  return (
    <div className="page-wrap space-y-8">
      <section className="page-header">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <span className="hero-kicker">Growth story</span>
            <h1 className="page-title mt-5">Measure progress in a way that actually motivates you.</h1>
            <p className="page-subtitle">
              Your quiz scores, resume quality, plan completion, and inferred readiness now sit together in a clearer growth report.
            </p>
          </div>

          <div className="surface-card-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Composite readiness</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-extrabold text-stone-900">{loading ? '--' : computed.composite}</span>
              <span className="pb-2 text-sm text-stone-400">/100</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">A blended signal based on your latest resume and quiz performance.</p>
            <button onClick={() => void fetchSummary(true)} className="btn-secondary mt-5">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh metrics
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="surface-card p-5 sm:p-6">
            <stat.icon className={`h-6 w-6 ${stat.color}`} />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-stone-900">{loading ? '--' : stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900">Skill breakdown</h2>
              <p className="mt-2 text-sm text-stone-600">Mapped around your current focus role: {computed.role}</p>
            </div>
            <span className="chip chip-neutral">{computed.role}</span>
          </div>

          <div className="mt-8 space-y-5">
            {computed.skills.map((skill) => (
              <div key={skill.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-stone-700">{skill.name}</span>
                  <span className="font-bold text-orange-700">{loading ? '--' : `${skill.pct}%`}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill transition-all duration-700" style={{ width: `${loading ? 0 : skill.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-stone-600">Plan completion: <span className="font-bold text-stone-900">{computed.completed}/{computed.total} modules</span> ({computed.completionPct}%)</p>
        </article>

        <article className="surface-card p-6 text-center sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-orange-50 text-orange-700">
            <TrendingUp className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-stone-900">{isReadyForInterview ? 'You are building real interview readiness' : 'Momentum is building nicely'}</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600">Next focus: <span className="font-bold text-stone-900">{computed.milestone}</span></p>
          <p className="mt-3 text-sm leading-7 text-stone-600">Composite score: <span className="font-bold text-orange-700">{computed.composite}/100</span></p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button onClick={() => navigate('/interview')} className="btn-primary w-full py-3.5">Start mock interview</button>
            <button onClick={() => navigate('/quiz')} className="btn-secondary w-full py-3.5">Improve quiz score</button>
          </div>
        </article>
      </section>
    </div>
  );
}
