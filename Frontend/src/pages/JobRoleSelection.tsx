import { useEffect, useMemo, useState } from 'react';
import { Briefcase, IndianRupee, Loader2, Search, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

type Role = {
  id: string | number;
  title: string;
  demand: string;
  salary: string;
  skills: string[];
};

export default function JobRoleSelection() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const res = await api.get('/jobs/trending');
        setRoles(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError('Could not load trending roles right now.');
      } finally {
        setLoading(false);
      }
    };

    void fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role) => {
      const inTitle = role.title.toLowerCase().includes(term);
      const inSkills = role.skills?.some((skill) => skill.toLowerCase().includes(term));
      return inTitle || inSkills;
    });
  }, [roles, searchTerm]);

  const handleSelectRole = (role: string) => {
    navigate('/plan', { state: { selectedRole: role } });
  };

  return (
    <div className="page-wrap space-y-8">
      <section className="page-header">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <span className="hero-kicker">Role explorer</span>
            <h1 className="page-title mt-5">Choose a path with stronger market context.</h1>
            <p className="page-subtitle">
              Browse trending roles, compare skill clusters, and jump straight into a personalized roadmap from the role that feels right.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Trending roles</p>
              <p className="mt-2 text-3xl font-extrabold text-stone-900">{roles.length}</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Search mode</p>
              <p className="mt-2 text-lg font-bold text-stone-900">Role or skill</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Next step</p>
              <p className="mt-2 text-lg font-bold text-stone-900">Build a plan instantly</p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card p-5 sm:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role title or skill..."
            className="field pl-12"
          />
        </div>
      </section>

      {error && <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="surface-card p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600" />
          <p className="mt-4 text-sm text-stone-600">Loading trending roles...</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredRoles.map((role) => (
            <article key={role.id} className="surface-card interactive-card p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-stone-900">{role.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span className="chip chip-accent">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {role.demand} demand
                    </span>
                    <span className="chip chip-neutral">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {role.salary}
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-orange-50 text-orange-700">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {role.skills?.map((skill) => (
                  <span key={skill} className="rounded-full bg-white/75 px-3 py-2 text-xs font-semibold text-stone-700">
                    {skill}
                  </span>
                ))}
              </div>

              <button onClick={() => handleSelectRole(role.title)} className="btn-primary mt-6 w-full py-3.5">
                <Sparkles className="h-4 w-4" />
                Start this learning path
              </button>
            </article>
          ))}

          {filteredRoles.length === 0 && (
            <div className="surface-card p-8 text-center text-stone-600 lg:col-span-2">No matching roles found. Try a broader keyword or search by skill.</div>
          )}
        </div>
      )}
    </div>
  );
}
