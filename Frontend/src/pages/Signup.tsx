import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Mail, Lock, Sparkles, UserRoundPlus, Users } from 'lucide-react';
import api from '../api/axios';

const starterNotes = [
  'Create a profile once and carry it across every training track.',
  'Build plans from trending roles and keep them synced automatically.',
  'Store your latest resume, quiz, and interview milestones in one journey.',
];

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/auth/signup', formData);
      setSuccess('Account created successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell lg:grid-cols-[0.92fr_1.08fr]">
      <section className="auth-stage flex flex-col justify-between">
        <div>
          <span className="hero-kicker">New account</span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-stone-900 sm:text-5xl">
            Start your learning studio in a few minutes.
          </h1>
          <p className="mt-5 text-base leading-8 text-stone-600">
            Create your profile, choose a role direction, and let the platform shape the next steps around your progress.
          </p>
        </div>

        <div className="space-y-4">
          <div className="surface-card-soft flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/80 text-teal-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-stone-900">Built for focused growth</p>
              <p className="mt-1 text-sm text-stone-600">No clutter, just clear milestones and useful feedback.</p>
            </div>
          </div>

          <div className="surface-card-soft p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-stone-500">What you unlock</p>
            <div className="mt-4 space-y-3">
              {starterNotes.map((note) => (
                <div key={note} className="flex gap-3 text-sm leading-6 text-stone-600">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-orange-600" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="auth-stage flex flex-col justify-center">
        <div className="mx-auto w-full max-w-xl">
          <span className="hero-kicker">Create your profile</span>
          <h2 className="mt-5 text-4xl font-extrabold text-stone-900">Join VidyaMitra</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">Set up your account and start building a career path that feels organized and achievable.</p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-stone-700">
                <span className="mb-2 block font-semibold">First name</span>
                <input
                  type="text"
                  required
                  className="field"
                  placeholder="First name"
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </label>
              <label className="block text-sm text-stone-700">
                <span className="mb-2 block font-semibold">Last name</span>
                <input
                  type="text"
                  required
                  className="field"
                  placeholder="Last name"
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </label>
            </div>

            <label className="block text-sm text-stone-700">
              <span className="mb-2 block font-semibold">Email address</span>
              <span className="relative block">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  className="field pl-11"
                  placeholder="name@example.com"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </span>
            </label>

            <label className="block text-sm text-stone-700">
              <span className="mb-2 block font-semibold">Password</span>
              <span className="relative block">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  className="field pl-11"
                  placeholder="Minimum 8 characters"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-sm text-stone-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-orange-700 transition hover:text-orange-800">
              Log in
            </Link>
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700">
            <UserRoundPlus className="h-3.5 w-3.5" />
            Your backend flow stays the same. This is a frontend refresh only.
          </div>
        </div>
      </section>
    </div>
  );
}
