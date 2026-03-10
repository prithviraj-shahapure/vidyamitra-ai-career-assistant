import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Target,
  TrendingUp,
  UserCircle2,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, description: 'Live readiness, momentum, and career signals.' },
  { name: 'Profile', path: '/profile', icon: UserCircle2, description: 'Your identity, recent work, and account summary.' },
  { name: 'Resume Studio', path: '/resume', icon: FileText, description: 'Upload, score, and sharpen your resume.' },
  { name: 'Role Explorer', path: '/roles', icon: Target, description: 'Compare promising paths and pick a focus.' },
  { name: 'Learning Plan', path: '/plan', icon: BookOpen, description: 'Generate and track a tailored roadmap.' },
  { name: 'Quiz Lab', path: '/quiz', icon: BrainCircuit, description: 'Practice concepts with AI-generated checks.' },
  { name: 'Interview Room', path: '/interview', icon: Mic, description: 'Speak answers out loud and build confidence.' },
  { name: 'Progress', path: '/progress', icon: TrendingUp, description: 'See your growth story from every angle.' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentItem = useMemo(() => {
    return navItems.find((item) => location.pathname.startsWith(item.path)) || null;
  }, [location.pathname]);

  const currentPage = currentItem?.name || 'Workspace';
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    [],
  );

  const handleLogout = () => {
    localStorage.removeItem('vidyamitra_user_id');
    localStorage.removeItem('vidyamitra_token');
    localStorage.removeItem('vidyamitra_refresh_token');
    navigate('/login');
  };

  const sidebarNav = (
    <>
      <div className="border-b border-stone-900/10 px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="brand-mark">VM</div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-stone-500">Career OS</p>
            <h1 className="mt-1 text-2xl font-extrabold">VidyaMitra</h1>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-stone-600">
          A warmer, focused career workspace for building skills, proving growth, and preparing for interviews.
        </p>

        <div className="mt-5 surface-card-soft p-4">
          <p className="hero-kicker">Workspace pulse</p>
          <h2 className="mt-3 text-lg font-bold text-stone-900">One place for your resume, plan, quiz, and interview practice.</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[20px] bg-white/65 p-3">
              <p className="text-stone-500">Tracks</p>
              <p className="mt-1 text-xl font-extrabold text-stone-900">8</p>
            </div>
            <div className="rounded-[20px] bg-white/65 p-3">
              <p className="text-stone-500">Sync</p>
              <p className="mt-1 text-xl font-extrabold text-teal-700">Live</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="soft-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <p className="px-4 pb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-stone-500">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              data-active={isActive ? 'true' : 'false'}
              className="sidebar-link group"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${isActive ? 'bg-orange-100 text-orange-700' : 'bg-white/70 text-stone-500 group-hover:text-stone-700'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-current">{item.name}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-900/10 px-4 py-4">
        <div className="surface-card-soft mb-3 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-500">Today</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">{todayLabel}</p>
              <p className="mt-1 text-xs text-stone-500">Keep your practice streak moving.</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-stone-400" />
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary w-full justify-center border-rose-200/70 bg-rose-50/80 text-rose-700 hover:border-rose-300 hover:bg-rose-100/80"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[6%] top-[-120px] h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute right-[8%] top-[12%] h-64 w-64 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[38%] h-80 w-80 rounded-full bg-amber-100/50 blur-3xl" />
      </div>

      <aside className="app-sidebar">{sidebarNav}</aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="btn-secondary h-11 w-11 px-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">Workspace</p>
              <h2 className="truncate text-lg font-bold text-stone-900">{currentPage}</h2>
            </div>
          </div>

          <div>
            <p className="hidden text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500 lg:inline-flex">Workspace</p>
            <h2 className="mt-1 hidden text-2xl font-bold text-stone-900 lg:block">{currentPage}</h2>
            <p className="mt-1 hidden text-sm text-stone-600 lg:block">{currentItem?.description || 'Your personalized learning studio.'}</p>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="chip chip-neutral">
              <CalendarDays className="h-3.5 w-3.5" />
              {todayLabel}
            </span>
            <span className="chip chip-accent">Learning mode on</span>
          </div>
        </header>

        {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-stone-950/25 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[320px] max-w-[90vw] flex-col border-r border-stone-900/10 bg-[rgba(255,250,243,0.96)] backdrop-blur-xl transition-transform duration-300 lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarNav}
        </aside>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
