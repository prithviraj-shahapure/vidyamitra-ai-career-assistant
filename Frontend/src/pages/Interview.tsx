import { useEffect, useRef, useState } from 'react';
import { AlertCircle, History, Loader2, Mic, Sparkles, Square, Volume2 } from 'lucide-react';
import api from '../api/axios';

type InterviewState = 'selection' | 'in-progress' | 'completed';
type Message = { role: 'user' | 'assistant'; content: string };

type InterviewHistory = {
  id: string;
  role_applied_for: string;
  readiness_score: number;
  created_at?: string;
};

type SpeechWindow = Window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

const INTERVIEW_STORAGE_KEY = 'vidyamitra_interview_state_v1';

export default function Interview() {
  const [currentState, setCurrentState] = useState<InterviewState>('selection');
  const [jobRole, setJobRole] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState<InterviewHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const loadHistory = async () => {
    try {
      const res = await api.get('/interview/history');
      setHistory(Array.isArray(res.data?.history) ? res.data.history : []);
    } catch (e) {
      console.error('Failed to load interview history', e);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCurrentState(parsed.currentState || 'selection');
        setJobRole(parsed.jobRole || '');
        setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
      } catch {
        // ignore
      }
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (Recognition) {
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }

    void loadHistory();

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify({ currentState, jobRole, messages }));
  }, [currentState, jobRole, messages]);

  useEffect(() => {
    if (currentState === 'in-progress' && (!jobRole.trim() || messages.length === 0)) {
      setCurrentState('selection');
    }
  }, [currentState, jobRole, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  const speakAIResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startInterview = async () => {
    if (!jobRole.trim()) return;
    setError(null);
    setCurrentState('in-progress');
    const firstQuestion = `Hello! Let's start the interview for the ${jobRole} position. Can you tell me about yourself and your background?`;
    setMessages([{ role: 'assistant', content: firstQuestion }]);
    speakAIResponse(firstQuestion);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      window.speechSynthesis.cancel();
      if (transcript.trim()) void sendVoiceMessage(transcript.trim());
      setTranscript('');
      return;
    }

    setTranscript('');
    recognitionRef.current.start();
    setIsListening(true);
    window.speechSynthesis.cancel();
  };

  const sendVoiceMessage = async (spokenText: string) => {
    const lastAssistantMessage = messages.slice().reverse().find((message) => message.role === 'assistant');
    const lastQuestion = lastAssistantMessage ? lastAssistantMessage.content : 'Tell me about yourself.';
    const newMessages = [...messages, { role: 'user', content: spokenText } as Message];
    setMessages(newMessages);
    setIsProcessing(true);

    try {
      const response = await api.post('/interview/evaluate', {
        role: jobRole,
        question: lastQuestion,
        answer: spokenText,
      });

      const data = response.data;
      const aiReply = `${data.feedback} ${data.next_question}`;
      setMessages([...newMessages, { role: 'assistant', content: aiReply }]);
      speakAIResponse(aiReply);
      setError(null);
    } catch (e: any) {
      console.error('Failed to send message', e);
      setError(e?.response?.data?.detail || 'Could not evaluate this answer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const finishInterview = async () => {
    setCurrentState('completed');
    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();

    try {
      const estimatedScore = Math.min(95, Math.max(50, messages.length * 8));
      await api.post('/interview/submit', {
        role_applied_for: jobRole,
        readiness_score: estimatedScore,
        feedback: { summary: 'Voice Interview Session', messages_exchanged: messages.length },
      });
      await loadHistory();
      window.dispatchEvent(new Event('progress-updated'));
    } catch (e) {
      console.error('Failed to sync interview results', e);
    }
  };

  return (
    <div className="page-wrap max-w-6xl space-y-8">
      {currentState === 'selection' && (
        <>
          <section className="page-header">
            <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
              <div>
                <span className="hero-kicker">Interview room</span>
                <h1 className="page-title mt-5">Practice speaking like the real interview already started.</h1>
                <p className="page-subtitle">
                  The backend interview flow is unchanged. The frontend now gives the session more clarity, more breathing room, and better focus.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                <div className="surface-card-soft p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Past sessions</p>
                  <p className="mt-2 text-3xl font-extrabold text-stone-900">{history.length}</p>
                </div>
                <div className="surface-card-soft p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Format</p>
                  <p className="mt-2 text-lg font-bold text-stone-900">Voice-led practice</p>
                </div>
                <div className="surface-card-soft p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Best for</p>
                  <p className="mt-2 text-lg font-bold text-stone-900">Confidence + fluency</p>
                </div>
              </div>
            </div>
          </section>

          {history.length > 0 && (
            <section className="surface-card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-teal-700" />
                <h2 className="text-2xl font-extrabold text-stone-900">Recent interview history</h2>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {history.slice(0, 6).map((item) => (
                  <div key={item.id} className="surface-card-soft p-4">
                    <p className="font-bold text-stone-900">{item.role_applied_for}</p>
                    <p className="mt-2 text-sm text-stone-600">Readiness score {item.readiness_score}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <section className="surface-card p-6 sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr] xl:items-center">
              <div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-orange-50 text-orange-700">
                  <Mic className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-3xl font-extrabold text-stone-900">Start a voice interview</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">Put on headphones if you have them. The AI will ask, speak, and follow up as the conversation continues.</p>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Python Developer"
                  className="field mt-6"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
                <button onClick={startInterview} disabled={!jobRole.trim()} className="btn-primary mt-5 w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-55">
                  Start interview
                </button>
              </div>

              <div className="surface-card-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Session tips</p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
                  <p>1. Answer naturally first, then tighten the details.</p>
                  <p>2. Speak in complete thoughts so the AI has better context for follow-up questions.</p>
                  <p>3. End the session only after you have handled a few rounds and want the score saved.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {currentState === 'in-progress' && (
        <section className="surface-card flex h-[80vh] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-900/10 bg-white/55 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Interviewing for</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-extrabold text-stone-900">
                <Volume2 className="h-5 w-5 text-orange-700" />
                {jobRole}
              </h2>
            </div>
            <button onClick={finishInterview} className="btn-secondary border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300">
              End interview
            </button>
          </div>

          <div className="soft-scrollbar flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[88%] ${msg.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-user'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {transcript && (
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-[24px] rounded-tr-md border border-orange-200 bg-orange-50 p-4 text-sm italic text-orange-800">
                  <p>{transcript}</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="chat-bubble-ai inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-700" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-stone-900/10 bg-white/55 p-5 text-center">
            <p className="mb-4 text-sm text-stone-600">{isListening ? 'Listening now. Tap stop when you finish speaking.' : 'Tap the mic when you are ready to answer.'}</p>
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`mx-auto inline-flex h-[78px] w-[78px] items-center justify-center rounded-full text-white transition-all ${
                isListening
                  ? 'animate-pulse bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_18px_40px_rgba(244,63,94,0.25)]'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_18px_40px_rgba(207,107,61,0.24)] hover:brightness-105'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isListening ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-8 w-8" />}
            </button>
          </div>
        </section>
      )}

      {currentState === 'completed' && (
        <section className="surface-card mt-8 space-y-5 p-8 text-center sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-50 text-emerald-700">
            <Sparkles className="h-10 w-10" />
          </div>
          <h2 className="text-4xl font-extrabold text-stone-900">Interview completed</h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-stone-600">Great session. Saying your answers aloud is one of the fastest ways to improve both structure and confidence.</p>
          <button onClick={() => setCurrentState('selection')} className="btn-primary px-8 py-3.5">
            Start another session
          </button>
        </section>
      )}
    </div>
  );
}
