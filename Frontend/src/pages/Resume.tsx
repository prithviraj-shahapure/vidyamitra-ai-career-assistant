import { useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Loader2, ShieldCheck, Sparkles, Target, Upload } from 'lucide-react';
import api from '../api/axios';

type ResumeFeedback = {
  strengths?: string[];
  weaknesses?: string[];
};

type ResumeResult = {
  score: number;
  feedback?: ResumeFeedback;
};

const tips = [
  'Align the resume with one target role for sharper keyword matching.',
  'Keep project outcomes measurable so the ATS score reflects impact.',
  'Use the strengths and gaps below to iterate in focused passes.',
];

export default function Resume() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) return;
    setFile(nextFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/resume/evaluate', formData, {
        headers: {
          'X-Target-Role': targetRole,
        },
      });
      setResult(response.data);
      window.dispatchEvent(new Event('progress-updated'));
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Failed to evaluate resume. Your session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap space-y-8">
      <section className="page-header">
        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div>
            <span className="hero-kicker">Resume studio</span>
            <h1 className="page-title mt-5">Turn your resume into a stronger first impression.</h1>
            <p className="page-subtitle">
              Upload your PDF, anchor it to a target role, and get a cleaner view of what is working, what is missing, and where to improve next.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Format</p>
              <p className="mt-2 text-lg font-bold text-stone-900">PDF upload</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Best use</p>
              <p className="mt-2 text-lg font-bold text-stone-900">Role-specific tailoring</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Result</p>
              <p className="mt-2 text-lg font-bold text-stone-900">Score + actionable notes</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="surface-card p-6 sm:p-8">
          <div className="space-y-6">
            <label className="block text-sm text-stone-700">
              <span className="mb-2 block font-semibold">Target job role</span>
              <input
                type="text"
                placeholder="Frontend Developer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="resume-role-input field"
              />
            </label>

            <div>
              <p className="mb-3 text-sm font-semibold text-stone-700">Upload resume</p>
              <div
                data-active={dragActive ? 'true' : 'false'}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFileChange(e.dataTransfer.files?.[0] ?? null);
                }}
                className="drop-zone"
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/80 text-orange-700">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-lg font-bold text-stone-900">{file ? file.name : 'Drop a PDF here or click to browse'}</p>
                  <p className="mt-2 text-sm text-stone-600">The current flow and backend endpoint stay unchanged. Only the presentation is new.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {tips.map((tip) => (
                <div key={tip} className="surface-card-soft flex items-start gap-3 p-4 text-sm leading-6 text-stone-600">
                  <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-teal-700" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button onClick={handleUpload} disabled={loading || !file} className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze resume'}
            </button>
          </div>
        </section>

        <section className="surface-card min-h-[420px] p-6 sm:p-8">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
              <p className="mt-4 text-sm text-stone-600">Parsing your PDF and comparing it against role expectations...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="rounded-[28px] bg-orange-50 p-6 text-center">
                <span className="chip chip-brand mx-auto">
                  <Sparkles className="h-3.5 w-3.5" />
                  ATS match score
                </span>
                <div className="mt-4 text-6xl font-extrabold text-stone-900">
                  {result.score}
                  <span className="text-2xl text-stone-400">/100</span>
                </div>
                <p className="mt-3 text-sm text-stone-600">Use this as a direction signal, then improve the specifics section by section.</p>
              </div>

              {result.feedback && (
                <div className="grid gap-4">
                  <div className="surface-card-soft p-5">
                    <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Strengths
                    </p>
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-700">
                      {result.feedback.strengths?.map((item, idx) => (
                        <li key={idx} className="rounded-[18px] bg-white/70 px-4 py-3">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="surface-card-soft p-5">
                    <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-orange-700">
                      <Target className="h-4 w-4" />
                      Areas to improve
                    </p>
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-700">
                      {result.feedback.weaknesses?.map((item, idx) => (
                        <li key={idx} className="rounded-[18px] bg-white/70 px-4 py-3">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-orange-50 text-orange-700">
                <FileText className="h-9 w-9" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-stone-900">Your resume analysis will appear here</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-stone-600">
                Upload a PDF, set a target role, and you will see a cleaner score summary plus targeted strengths and improvement areas.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
