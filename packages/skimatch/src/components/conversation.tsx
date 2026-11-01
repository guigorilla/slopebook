"use client";
import { useEffect, useRef, useState } from "react";
import { Question, validateAnswer } from "../lib/conversation";
import { CustomerAnswer } from "../types/domain";
import { answerText } from "../lib/profile";
import { MountainMark } from "./mountain";
interface Props {
  questions: Question[]; onAnswer: (question: Question, answer: CustomerAnswer) => void;
  onComplete: () => void; finishLabel: string; title: string; subtitle: string;
  onProgress?: (step: number) => void;
}
export function Conversation({ questions, onAnswer, onComplete, finishLabel, title, subtitle, onProgress }: Props) {
  const [step, setStep] = useState(0);
  const [commentary, setCommentary] = useState("");
  const [selection, setSelection] = useState<string>();
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ prompt: string; answer: CustomerAnswer }[]>([]);
  const bottom = useRef<HTMLDivElement>(null); const input = useRef<HTMLTextAreaElement>(null);
  const question = questions[step];
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); input.current?.focus({ preventScroll: true }); }, [step]);
  function submit() {
    if (!question) return;
    const answer: CustomerAnswer = { ...(selection ? { selectedOption: selection } : {}), commentary };
    const issue = validateAnswer(question, answer);
    if (issue) { setError(issue); return; }
    onAnswer(question, answer); setHistory(h => [...h, { prompt: question.prompt, answer }]);
    setStep(step + 1); onProgress?.(step + 1); setCommentary(""); setSelection(undefined); setError("");
  }
  return <section className="chat card" aria-label={title}>
    <div className="chat-heading"><span className="guide-icon"><MountainMark/></span><div><h2>{title}</h2><p><span className="status-dot"/> {subtitle}</p></div><span className="tag">LOCAL DEMO</span></div>
    <div className="chat-progress" role="progressbar" aria-label="Conversation progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={Math.min(step, questions.length)}><span style={{ width: `${step / questions.length * 100}%` }}/></div>
    <div className="chat-messages"><div className="chat-date">YOUR NEXT CHAPTER ON SNOW</div>
      {history.map((item, i) => <div key={i} className="exchange"><div className="guide-message"><span className="small-avatar">S</span><p>{item.prompt}</p></div><div className="user-message"><p>{answerText(item.answer)}</p></div></div>)}
      <div aria-live="polite" aria-atomic="true"><div className="guide-message"><span className="small-avatar">S</span><p>{question?.prompt || "All set. Your own words are saved alongside the profile. Review what you shared, then continue when you're ready."}</p></div></div><div ref={bottom}/>
    </div>
    <div className="chat-composer">{question ? <>
      {question.previousAnswer && <button className="previous-answer" onClick={() => { setSelection(question.previousAnswer?.selectedOption); setCommentary(question.previousAnswer?.commentary || ""); input.current?.focus({ preventScroll: true }); }}>Use previous answer: {answerText(question.previousAnswer)}</button>}
      {!!question.suggestions?.length && <div className="suggestions" aria-label="Suggested answers">{question.suggestions.map(s => <button key={s} aria-pressed={selection === s} onClick={() => { setSelection(selection === s ? undefined : s); setError(""); input.current?.focus({ preventScroll: true }); }}>{s}</button>)}</div>}
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <label htmlFor="chat-answer" className="composer-label">{selection ? "Add anything else you'd like us to know" : "Tell me in your own words"}</label>
        <textarea id="chat-answer" ref={input} value={commentary} maxLength={1200} rows={3} onChange={e => setCommentary(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder={selection ? "Optional details — your words matter…" : "Describe it however you like — no ski-school terminology needed…"}/>
        <div className="composer-actions"><span>{selection ? `Selected: ${selection}` : "Suggestions are shortcuts, not restrictions."}</span><button className="button primary" type="submit">Send <span>↑</span></button></div>
      </form>
      {error && <p role="alert" className="error">{error}</p>}
      <p className="composer-note">Choose a shortcut, write freely, or do both · Enter to send · Shift+Enter for a new line</p>
    </> : <button className="button primary full" onClick={onComplete}>{finishLabel} <span>↗</span></button>}</div>
  </section>;
}
