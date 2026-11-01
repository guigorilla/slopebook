"use client";
import { useEffect, useRef, useState } from "react";
import { MountainMark } from "./mountain";
import { answerText } from "../lib/profile";
import type { BookingRequest, CustomerAnswer } from "../types/domain";
import type { BookingAgentInput, BookingAgentMessage, BookingAgentReply } from "../types/booking-agent";

const retryMessage = "Your mountain guide couldn't respond just now. Your conversation and profile are safe. Please try again.";
function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
async function getAgentReply(payload: BookingAgentInput, signal?: AbortSignal): Promise<BookingAgentReply> {
  const response = await fetch("/api/booking-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal });
  if (!response.ok) throw new Error(retryMessage);
  const reply = await response.json() as BookingAgentReply;
  if (typeof reply.assistantMessage !== "string" || !Array.isArray(reply.quickReplies) || !reply.extractedProfile || typeof reply.readyToMatch !== "boolean") throw new Error(retryMessage);
  return reply;
}
export function BookingAgent({ profile, onProfile, onComplete }: { profile: BookingRequest; onProfile: (profile: BookingRequest) => void; onComplete: () => void }) {
  const initialProfile = useRef(profile);
  const [history, setHistory] = useState<BookingAgentMessage[]>([]);
  const [reply, setReply] = useState<BookingAgentReply>();
  const [commentary, setCommentary] = useState("");
  const [selection, setSelection] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<BookingAgentInput>();
  const input = useRef<HTMLTextAreaElement>(null); const bottom = useRef<HTMLDivElement>(null);
  const active = useRef<AbortController | null>(null); const inFlight = useRef(true);
  useEffect(() => {
    const controller = new AbortController(); active.current = controller;
    const payload: BookingAgentInput = { conversation: [], bookingProfile: initialProfile.current, localDate: today() };
    getAgentReply(payload, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setReply(result); setHistory([{ role: "assistant", content: result.assistantMessage }]); onProfile(result.extractedProfile);
    }).catch(() => { if (!controller.signal.aborted) { setError(retryMessage); setPending(payload); } })
      .finally(() => { if (!controller.signal.aborted) { setLoading(false); inFlight.current = false; } });
    return () => controller.abort();
  }, [onProfile]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); if (!loading) input.current?.focus({ preventScroll: true }); }, [history, loading]);
  useEffect(() => () => active.current?.abort(), []);
  async function run(payload: BookingAgentInput) {
    if (inFlight.current) return;
    inFlight.current = true; setLoading(true); setError("");
    const controller = new AbortController(); active.current = controller;
    try {
      const result = await getAgentReply(payload, controller.signal);
      if (controller.signal.aborted) return;
      onProfile(result.extractedProfile); setReply(result);
      setHistory([...payload.conversation, { role: "assistant", content: result.assistantMessage }]);
      setPending(undefined); setCommentary(""); setSelection(undefined);
    } catch { if (!controller.signal.aborted) { setError(retryMessage); setPending(payload); } }
    finally { if (!controller.signal.aborted) { setLoading(false); inFlight.current = false; } }
  }
  function submit() {
    if (inFlight.current || pending) return;
    const answer: CustomerAnswer = { ...(selection ? { selectedOption: selection } : {}), commentary };
    if (!answerText(answer).trim()) { setError("Tell me a little, or choose a suggestion to continue."); return; }
    const conversation: BookingAgentMessage[] = [...history, { role: "user", content: answerText(answer), answer }];
    setHistory(conversation); void run({ conversation, bookingProfile: profile, localDate: today() });
  }
  return <section className="chat card" aria-label="Your mountain guide" aria-busy={loading}>
    <div className="chat-heading"><span className="guide-icon"><MountainMark/></span><div><h2>Your mountain guide</h2><p><span className="status-dot"/> Your own words, with a few helpful shortcuts</p></div><span className="tag">OPENAI BOOKING</span></div>
    <div className="chat-progress"><span style={{ width: reply?.readyToMatch ? "100%" : `${Math.min(90, history.filter(m => m.role === "user").length * 12)}%` }}/></div>
    <div className="chat-messages"><div className="chat-date">YOUR NEXT CHAPTER ON SNOW</div>
      {history.map((message, index) => message.role === "assistant" ? <div className="guide-message" key={index}><span className="small-avatar">S</span><p>{message.content}</p></div> : <div className="user-message" key={index}><p>{message.content}</p></div>)}
      {loading && <div className="guide-message" role="status"><span className="small-avatar">S</span><p>{history.length ? "Thinking about your mountain day…" : "Connecting with your mountain guide…"}</p></div>}
      <div ref={bottom}/>
    </div>
    <div className="chat-composer">
      {!!reply?.quickReplies.length && !pending && <div className="suggestions" aria-label="Suggested answers">{reply.quickReplies.map(s => <button key={s} disabled={loading} aria-pressed={selection === s} onClick={() => { setSelection(selection === s ? undefined : s); setError(""); input.current?.focus({ preventScroll: true }); }}>{s}</button>)}</div>}
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <label htmlFor="chat-answer" className="composer-label">{selection ? "Add anything else you'd like us to know" : "Tell me in your own words"}</label>
        <textarea id="chat-answer" ref={input} value={commentary} maxLength={1200} rows={3} disabled={loading || !!pending} onChange={e => setCommentary(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }} placeholder={selection ? "Optional details — your words matter…" : "Describe it however you like — no ski-school terminology needed…"}/>
        <div className="composer-actions"><span>{selection ? `Selected: ${selection}` : "Suggestions are shortcuts, not restrictions."}</span><button className="button primary" type="submit" disabled={loading || !!pending}>Send <span>↑</span></button></div>
      </form>
      {error && <div role="alert"><p className="error">{error}</p>{pending && <button className="button secondary" disabled={loading} onClick={() => void run(pending)}>Retry last request</button>}</div>}
      <p className="composer-note">Choose a shortcut, write freely, or do both · Enter to send · Shift+Enter for a new line</p>
      {reply?.readyToMatch && !loading && !pending && <button className="button primary full" onClick={onComplete}>See my matches <span>↗</span></button>}
    </div>
  </section>;
}
