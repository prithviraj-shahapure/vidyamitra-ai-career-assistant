import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, ShieldCheck, Sparkles, Target, User } from 'lucide-react';
import api from '../api/axios';

const highlights = [
  {
    title: 'Role clarity',
    description: 'Discover where your strengths fit and what to build next.',
    icon: Target,
  },
  {
    title: 'Trusted feedback',
    description: 'See resume, quiz, and interview signals in one place.',
    icon: ShieldCheck,
  },
  {
    title: 'Warm guidance',
    description: 'Turn scattered prep into a calm, guided training flow.',
    icon: Sparkles,
  },
];

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('vidyamitra_user_id', res.data.user_id);
      localStorage.setItem('vidyamitra_token', res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem('vidyamitra_refresh_token', res.data.refresh_token);
      }
      navigate('/dashboard');
    } catch {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-stage hidden lg:flex lg:flex-col lg:justify-between">
        <div>
          <span className="hero-kicker">Career accelerator</span>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight text-stone-900">
            A fresher frontend for a clearer career journey.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-600">
            VidyaMitra now feels less like a dashboard and more like a guided studio. Track your growth, practice with confidence,
            and keep every step of your preparation connected.
          </p>
        </div>

        <div className="grid gap-4">
          {highlights.map((item) => (
            <article key={item.title} className="surface-card-soft p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/80 text-orange-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="auth-stage flex flex-col justify-center">
        <div className="mx-auto w-full max-w-md">
          <span className="hero-kicker">Welcome back</span>
          <h2 className="mt-5 text-4xl font-extrabold text-stone-900">Sign in to your workspace</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Pick up right where you left off across your plan, resume feedback, quizzes, and mock interviews.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm text-stone-700">
              <span className="mb-2 block font-semibold">Email address</span>
              <span className="relative block">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="field pl-11 pr-12"
                  placeholder="Enter your password"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enter workspace'}
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-bold text-orange-700 transition hover:text-orange-800">
                Create one
              </Link>
            </p>
            <span className="inline-flex items-center gap-2 font-semibold text-stone-500">
              Secure login <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
