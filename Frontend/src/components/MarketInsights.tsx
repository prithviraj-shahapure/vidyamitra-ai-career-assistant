import { useEffect, useState } from 'react';
import { ExternalLink, Globe2, LineChart, Loader2, Newspaper, RefreshCw } from 'lucide-react';
import api from '../api/axios';

interface MarketData {
  domain: string;
  news: { title: string; url: string; source: string }[];
  exchange_rate: { currency_pair: string; rate: number } | null;
}

export default function MarketInsights({ domain = 'Technology' }: { domain?: string }) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await api.get(`/market/insights?domain=${encodeURIComponent(domain)}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch market insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchInsights(false);
  }, [domain]);

  if (loading) {
    return (
      <section className="surface-card flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm font-semibold text-stone-700">Scanning global signals for {domain}...</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="hero-kicker">Market window</span>
          <h2 className="mt-4 flex items-center gap-3 text-3xl font-extrabold text-stone-900">
            <Globe2 className="h-7 w-7 text-teal-700" />
            Industry context for {domain}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Keep your prep connected to the outside world so your plan reflects where the market is moving, not just what is inside the app.
          </p>
        </div>

        <button onClick={() => void fetchInsights(true)} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="surface-card-soft p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/80 text-orange-700">
              <LineChart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Exchange watch</p>
              <h3 className="text-lg font-bold text-stone-900">Currency context</h3>
            </div>
          </div>

          {data.exchange_rate?.rate ? (
            <div className="mt-6 rounded-[24px] bg-white/75 p-5">
              <p className="text-sm text-stone-500">{data.exchange_rate.currency_pair}</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-stone-900">INR {data.exchange_rate.rate.toFixed(2)}</span>
                <span className="pb-1 text-sm text-stone-400">per USD</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">Useful context when you are comparing remote pay bands or global job markets.</p>
            </div>
          ) : (
            <p className="mt-6 text-sm leading-6 text-stone-600">Live exchange data is unavailable at the moment.</p>
          )}
        </article>

        <article className="surface-card-soft p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/80 text-teal-700">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Latest headlines</p>
              <h3 className="text-lg font-bold text-stone-900">News worth scanning</h3>
            </div>
          </div>

          {data.news.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {data.news.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-card rounded-[24px] border border-stone-900/8 bg-white/70 p-4"
                >
                  <h4 className="line-clamp-2 text-base font-bold text-stone-900">{article.title}</h4>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-stone-500">
                    <span>{article.source}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-orange-700">
                      Open
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-[24px] bg-white/70 p-5 text-sm leading-6 text-stone-600">No recent industry headlines were returned for this domain.</p>
          )}
        </article>
      </div>
    </section>
  );
}
