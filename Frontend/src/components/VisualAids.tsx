import { useEffect, useState } from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import api from '../api/axios';

type Visual = {
  id: string | number;
  src?: string;
  image?: string;
  url?: string;
  alt?: string;
  photographer?: string;
};

const FALLBACK_VISUALS: Visual[] = [
  {
    id: 'fallback-1',
    src: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Programming setup',
    photographer: 'Pexels',
    url: 'https://www.pexels.com/',
  },
  {
    id: 'fallback-2',
    src: 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Analytics dashboard',
    photographer: 'Pexels',
    url: 'https://www.pexels.com/',
  },
  {
    id: 'fallback-3',
    src: 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Code on screen',
    photographer: 'Pexels',
    url: 'https://www.pexels.com/',
  },
];

export default function VisualAids({ topic }: { topic: string }) {
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisuals = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/media/visuals?topic=${encodeURIComponent(topic)}`);
        const apiVisuals = Array.isArray(res.data?.visuals) ? res.data.visuals : [];
        setVisuals(apiVisuals.length > 0 ? apiVisuals : FALLBACK_VISUALS);
      } catch (err) {
        console.error('Failed to load Pexels visuals', err);
        setVisuals(FALLBACK_VISUALS);
      } finally {
        setLoading(false);
      }
    };

    if (topic) {
      void loadVisuals();
    } else {
      setVisuals(FALLBACK_VISUALS);
      setLoading(false);
    }
  }, [topic]);

  if (loading) return <div className="surface-card h-48 animate-pulse" />;

  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="hero-kicker">Visual aids</span>
          <h2 className="mt-4 flex items-center gap-3 text-3xl font-extrabold text-stone-900">
            <ImageIcon className="h-7 w-7 text-orange-700" />
            Visual learning resources
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">Use visual references to keep the milestone concrete and easier to remember.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visuals.map((img) => {
          const imageSrc = img.src || img.image || img.url;
          return (
            <div key={String(img.id)} className="group overflow-hidden rounded-[28px] border border-stone-900/10 bg-white/75 shadow-[0_18px_40px_rgba(86,68,45,0.1)]">
              <div className="relative overflow-hidden">
                <img
                  src={imageSrc}
                  alt={img.alt || 'Learning resource'}
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_VISUALS[0].src as string;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              <div className="p-4">
                <p className="text-sm font-bold text-stone-900">{img.alt || 'Learning resource'}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-stone-500">
                  <span>Photo by {img.photographer || 'Pexels'}</span>
                  <a href={img.url || 'https://www.pexels.com/'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-orange-700">
                    View
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visuals.length === 0 && <p className="mt-4 text-sm text-stone-600">No visuals available for this topic yet.</p>}
    </section>
  );
}
