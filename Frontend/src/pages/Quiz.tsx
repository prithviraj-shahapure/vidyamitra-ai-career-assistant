import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, ChevronRight, History, Loader2, RefreshCw, XCircle } from 'lucide-react';
import api from '../api/axios';

type Question = { question: string; options: string[]; answer: string };
type QuizAttempt = { id: string; topic: string; score: number; total_questions: number; created_at?: string };

const QUIZ_STORAGE_KEY = 'vidyamitra_quiz_state_v1';

export default function Quiz() {
  const [jobRole, setJobRole] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const res = await api.get('/quiz/history');
      setHistory(Array.isArray(res.data?.history) ? res.data.history : []);
    } catch (e) {
      console.error('Failed to load quiz history', e);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setJobRole(parsed.jobRole || '');
        setQuestions(Array.isArray(parsed.questions) ? parsed.questions : []);
        setCurrentIndex(typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0);
        setScore(typeof parsed.score === 'number' ? parsed.score : 0);
        setShowResult(!!parsed.showResult);
        setSelectedAnswer(parsed.selectedAnswer ?? null);
      } catch {
        // ignore
      }
    }
    void loadHistory();
  }, []);

  useEffect(() => {
    if (questions.length > 0 && currentIndex >= questions.length) {
      setCurrentIndex(0);
    }
  }, [questions, currentIndex]);

  useEffect(() => {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ jobRole, questions, currentIndex, score, showResult, selectedAnswer }));
  }, [jobRole, questions, currentIndex, score, showResult, selectedAnswer]);

  const startQuiz = async () => {
    if (!jobRole.trim()) return;
    setLoading(true);
    setError(null);
    setShowResult(false);
    setScore(0);
    setCurrentIndex(0);
    setSelectedAnswer(null);

    try {
      const res = await api.get(`/quiz/generate?role=${encodeURIComponent(jobRole)}`);
      setQuestions(Array.isArray(res.data?.questions) ? res.data.questions : []);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || 'Could not generate quiz right now.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (option: string) => {
    if (!currentQuestion || selectedAnswer) return;
    setSelectedAnswer(option);
  };

  const nextQuestion = async () => {
    if (!currentQuestion || !selectedAnswer) {
      setQuestions([]);
      setCurrentIndex(0);
      return;
    }

    const finalScore = score + (selectedAnswer === currentQuestion.answer ? 1 : 0);
    const nextIndex = currentIndex + 1;

    setScore(finalScore);
    setSelectedAnswer(null);

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      return;
    }

    setShowResult(true);

    try {
      const submitRes = await api.post('/quiz/submit', {
        topic: jobRole,
        score: finalScore,
        total_questions: questions.length,
      });

      if (submitRes.data?.attempt) setHistory((prev) => [submitRes.data.attempt, ...prev].slice(0, 30));
      else await loadHistory();

      window.dispatchEvent(new Event('progress-updated'));
    } catch (err) {
      console.error('Failed to sync quiz results', err);
    }
  };

  const scorePct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const progressPct = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const previewHistory = useMemo(() => history.slice(0, 6), [history]);

  return (
    <div className="page-wrap max-w-6xl space-y-8">
      <section className="page-header">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <span className="hero-kicker">Quiz lab</span>
            <h1 className="page-title mt-5">Practice knowledge in a way that feels purposeful.</h1>
            <p className="page-subtitle">
              Generate a quick technical check for your target role, stay honest with your score, and keep every attempt connected to your overall progress.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Recent attempts</p>
              <p className="mt-2 text-3xl font-extrabold text-stone-900">{history.length}</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Current role</p>
              <p className="mt-2 text-lg font-bold text-stone-900">{jobRole || 'Not selected yet'}</p>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Quiz mode</p>
              <p className="mt-2 text-lg font-bold text-stone-900">Adaptive Q&A</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {previewHistory.length > 0 && (
        <section className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-teal-700" />
            <h2 className="text-2xl font-extrabold text-stone-900">Recent quiz history</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {previewHistory.map((item) => (
              <div key={item.id} className="surface-card-soft p-4">
                <p className="font-bold text-stone-900">{item.topic}</p>
                <p className="mt-2 text-sm text-stone-600">Score {item.score}/{item.total_questions}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {questions.length === 0 && !loading && (
        <section className="surface-card p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr] xl:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-stone-900">Start a role-based quiz</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">Enter the role you want to practice for and let the current backend generate the questions for you.</p>
              <input
                type="text"
                placeholder="Enter a role, for example Java Developer"
                className="field mt-6"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />
              <button onClick={startQuiz} disabled={!jobRole.trim()} className="btn-primary mt-5 w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60">
                Generate quiz
              </button>
            </div>
            <div className="surface-card-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">How it works</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
                <p>1. Enter the role you want to prepare for.</p>
                <p>2. Answer each question carefully before moving forward.</p>
                <p>3. Your final score syncs back into the broader progress journey.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {loading && (
        <div className="surface-card p-12 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-600" />
          <p className="mt-4 text-sm text-stone-600">AI is crafting your quiz...</p>
        </div>
      )}

      {questions.length > 0 && !showResult && !loading && currentQuestion && (
        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>Score so far: {score}</span>
          </div>

          <div className="mt-4 progress-track">
            <div className="progress-fill transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>

          <h2 className="mt-8 text-2xl font-extrabold text-stone-900">{currentQuestion.question}</h2>

          <div className="mt-6 grid gap-3">
            {currentQuestion.options.map((option, i) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.answer;
              const showCorrect = !!selectedAnswer && isCorrect;
              const stateClass = isSelected
                ? isCorrect
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
                : showCorrect
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-stone-900/10 bg-white/75 text-stone-700 hover:border-orange-200 hover:bg-orange-50/70';

              return (
                <button
                  key={i}
                  disabled={!!selectedAnswer}
                  onClick={() => handleAnswer(option)}
                  className={`rounded-[24px] border p-4 text-left text-sm transition sm:text-base ${stateClass}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{option}</span>
                    {isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="h-5 w-5 shrink-0" />}
                    {!isSelected && showCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedAnswer && (
            <button onClick={nextQuestion} className="btn-primary mt-6 w-full py-3.5">
              {currentIndex + 1 === questions.length ? 'Finish quiz' : 'Next question'}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </section>
      )}

      {questions.length > 0 && !loading && !currentQuestion && (
        <div className="surface-card p-6 text-center text-stone-700">
          Saved quiz state was outdated. Start a fresh quiz.
          <button onClick={() => { setQuestions([]); setCurrentIndex(0); setShowResult(false); }} className="btn-secondary mx-auto mt-4">
            Reset quiz
          </button>
        </div>
      )}

      {showResult && (
        <section className="surface-card p-7 text-center sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-orange-50 text-orange-700">
            <BrainCircuit className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-4xl font-extrabold text-stone-900">Quiz complete</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            You scored <span className="font-extrabold text-stone-900">{score}</span> out of {questions.length} ({scorePct}%).
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button onClick={startQuiz} className="btn-primary w-full py-3.5">
              <RefreshCw className="h-4 w-4" />
              Retake quiz
            </button>
            <button onClick={() => { setQuestions([]); setShowResult(false); setSelectedAnswer(null); }} className="btn-secondary w-full py-3.5">
              Try a new topic
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
