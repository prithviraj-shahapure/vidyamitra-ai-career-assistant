import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  FileText,
  Mail,
  Mic,
  RefreshCw,
  Trophy,
  UserCircle2,
} from 'lucide-react';
import api from '../api/axios';

type ProfileResponse = {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    initials?: string;
    joined_at?: string;
  };
  summary: {
    best_resume: number;
    avg_quiz: number;
    total_activities: number;
    hours_trained: number;
    interview_rank: string;
    training_progress: {
      completed: number;
      total: number;
      milestone: string;
      role: string;
    };
  };
  counts: {
    plans: number;
    quizzes: number;
    interviews: number;
    resumes: number;
  };
  recent: {
    plans: Array<{
      id: string;
      role: string;
      current_milestone: string;
      completed_modules: number;
      total_modules: number;
      created_at?: string;
    }>;
    quizzes: Array<{
      id: string;
      topic: string;
      score: number;
      total_questions: number;
      created_at?: string;
    }>;
    interviews: Array<{
      id: string;
      role_applied_for: string;
      readiness_score: number;
      created_at?: string;
    }>;
    resumes: Array<{
      id: string;
      score: number;
      created_at?: string;
    }>;
  };
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileResponse | null>(null);

  const fetchProfile = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get<ProfileResponse>('/profile/me');
      setData(res.data);
      setError(null);
    } catch (e: any) {
      console.error('Profile fetch error:', e);
      setError(e?.response?.data?.detail || 'Could not load your profile right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile(false);
  }, [fetchProfile]);

  const fullName = useMemo(() => {
    const first = data?.user?.first_name?.trim() || '';
    const last = data?.user?.last_name?.trim() || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    return data?.user?.email || 'User';
  }, [data]);

  const trainingPct = useMemo(() => {
    const completed = data?.summary?.training_progress?.completed || 0;
    const total = Math.max(data?.summary?.training_progress?.total || 1, 1);
    return Math.round((completed / total) * 100);
  }, [data]);

  if (loading) {
    return (
      <div className="page-wrap py-8">
        <div className="surface-card p-8 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-orange-600" />
          <p className="mt-3 text-stone-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap space-y-8">
      <section className="page-header">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <span className="hero-kicker">Your profile</span>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-orange-100 text-3xl font-extrabold text-orange-800">
                {data?.user?.initials || 'U'}
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-stone-900">{fullName}</h1>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-600">
                  <span className="chip chip-neutral">
                    <Mail className="h-3.5 w-3.5" />
                    {data?.user?.email || 'N/A'}
                  </span>
                  <span className="chip chip-accent">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Joined {formatDate(data?.user?.joined_at)}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-600">
              Your account summary brings your progress, practice history, and skill-building momentum together in one warm, readable view.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Current role focus</p>
              <p className="mt-3 text-2xl font-extrabold text-stone-900">{data?.summary?.training_progress?.role || 'Technology'}</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Current milestone</p>
              <p className="mt-3 text-lg font-bold text-stone-900">{data?.summary?.training_progress?.milestone || 'Continue learning'}</p>
            </div>
            <button onClick={() => void fetchProfile(true)} className="btn-secondary justify-center">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh profile
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Best resume</p>
          <p className="mt-3 text-3xl font-extrabold text-stone-900">{data?.summary?.best_resume ?? 0}<span className="text-base text-stone-400">/100</span></p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Average quiz</p>
          <p className="mt-3 text-3xl font-extrabold text-teal-700">{data?.summary?.avg_quiz ?? 0}%</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Hours trained</p>
          <p className="mt-3 text-3xl font-extrabold text-orange-700">{data?.summary?.hours_trained ?? 0}h</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Interview rank</p>
          <p className="mt-3 text-3xl font-extrabold text-stone-900">{data?.summary?.interview_rank || 'Top 60%'}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Activities</p>
          <p className="mt-3 text-3xl font-extrabold text-stone-900">{data?.summary?.total_activities ?? 0}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-orange-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Training focus</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Your current learning lane is centered on <span className="font-bold text-stone-900">{data?.summary?.training_progress?.role || 'Technology'}</span>.
          </p>
          <div className="mt-5 progress-track">
            <div className="progress-fill" style={{ width: `${trainingPct}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
            <span>{data?.summary?.training_progress?.completed || 0} of {data?.summary?.training_progress?.total || 1} modules complete</span>
            <span className="font-bold text-orange-700">{trainingPct}%</span>
          </div>
          <div className="mt-6 rounded-[24px] bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Next milestone</p>
            <p className="mt-2 text-lg font-bold text-stone-900">{data?.summary?.training_progress?.milestone || 'Continue Learning'}</p>
          </div>
        </article>

        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-teal-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Records at a glance</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="surface-card-soft p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"><BookOpen className="h-4 w-4" /> Plans</p>
              <p className="mt-2 text-2xl font-extrabold text-stone-900">{data?.counts?.plans ?? 0}</p>
            </div>
            <div className="surface-card-soft p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"><BrainCircuit className="h-4 w-4" /> Quizzes</p>
              <p className="mt-2 text-2xl font-extrabold text-stone-900">{data?.counts?.quizzes ?? 0}</p>
            </div>
            <div className="surface-card-soft p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"><Mic className="h-4 w-4" /> Interviews</p>
              <p className="mt-2 text-2xl font-extrabold text-stone-900">{data?.counts?.interviews ?? 0}</p>
            </div>
            <div className="surface-card-soft p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"><FileText className="h-4 w-4" /> Resumes</p>
              <p className="mt-2 text-2xl font-extrabold text-stone-900">{data?.counts?.resumes ?? 0}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-orange-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Recent plans</h2>
          </div>
          <div className="mt-6 space-y-3">
            {(data?.recent?.plans || []).length === 0 && <p className="text-sm text-stone-600">No plan history yet.</p>}
            {(data?.recent?.plans || []).map((item) => (
              <div key={item.id} className="surface-card-soft p-4">
                <p className="font-bold text-stone-900">{item.current_milestone}</p>
                <p className="mt-1 text-sm text-stone-600">{item.role} • {item.completed_modules}/{item.total_modules} modules</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-6 w-6 text-teal-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Recent quizzes</h2>
          </div>
          <div className="mt-6 space-y-3">
            {(data?.recent?.quizzes || []).length === 0 && <p className="text-sm text-stone-600">No quiz attempts yet.</p>}
            {(data?.recent?.quizzes || []).map((item) => (
              <div key={item.id} className="surface-card-soft p-4">
                <p className="font-bold text-stone-900">{item.topic || 'General'}</p>
                <p className="mt-1 text-sm text-stone-600">Score {item.score}/{item.total_questions}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-orange-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Recent interviews</h2>
          </div>
          <div className="mt-6 space-y-3">
            {(data?.recent?.interviews || []).length === 0 && <p className="text-sm text-stone-600">No interview sessions yet.</p>}
            {(data?.recent?.interviews || []).map((item) => (
              <div key={item.id} className="surface-card-soft p-4">
                <p className="font-bold text-stone-900">{item.role_applied_for || 'Role'}</p>
                <p className="mt-1 text-sm text-stone-600">Readiness score: {item.readiness_score}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-6 w-6 text-teal-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Recent resume reviews</h2>
          </div>
          <div className="mt-6 space-y-3">
            {(data?.recent?.resumes || []).length === 0 && <p className="text-sm text-stone-600">No resume evaluations yet.</p>}
            {(data?.recent?.resumes || []).map((item) => (
              <div key={item.id} className="surface-card-soft p-4">
                <p className="font-bold text-stone-900">ATS Score: {item.score}/100</p>
                <p className="mt-1 text-sm text-stone-600">{formatDate(item.created_at)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
