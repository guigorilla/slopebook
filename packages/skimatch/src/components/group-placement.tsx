import { GroupPlacementRequest, LEVEL_LABELS, LESSON_SLOTS } from "../types/domain";
import { LessonProfile, formatDate } from "./lesson-profile";
import { profileText } from "../lib/profile";
export function GroupPlacement({ request, queueLength, onRevise, onNew }: { request: GroupPlacementRequest; queueLength: number; onRevise: () => void; onNew: () => void }) {
  const student = request.student;
  const dimensions = [
    ["Ability", LEVEL_LABELS[student.ability.level], "Find skiers who can work on appropriate skills together."],
    ["Age", `${student.age} years old`, "Consider development, pace, and suitable teaching activities."],
    ["Goals", profileText(student.goals), "Look for shared ambitions for the day."],
    ["Preferred terrain", profileText(student.terrain), "Find a comfortable practice environment for everyone."],
    ["Confidence", profileText(student.confidence), "Balance reassurance, challenge, and progression."],
    ["Learning style", profileText(student.learningPreferences), "Consider how skiers prefer to learn and receive feedback."],
  ];
  return <div className="workspace"><div className="page-heading"><div className="eyebrow">ONE SKIER. A GROUP BUILT AROUND FIT.</div><h1>You&apos;re ready for group matching.</h1><p>We&apos;ll match you with skiers of similar ability, goals, and learning style.</p></div>
    <div className="match-summary"><span>{request.resort}</span><span>{formatDate(request.requestedDate)}</span><span>{LESSON_SLOTS[request.slot].label}</span><span>One student · {student.name}</span></div>
    <div className="loop-strip group-loop"><strong>01 · In placement queue</strong><b>→</b><span>02 · Enough compatible skiers</span><b>→</b><span>03 · Allocated to a group</span><b>→</b><span>04 · Background instructor match</span></div>
    <p className="queue-note">{queueLength} {queueLength === 1 ? "request" : "requests"} saved in this local demo queue across all resorts and dates. No allocation algorithm runs, regardless of the count.</p>
    <div className="group-layout"><LessonProfile request={request}/><section className="card group-demo"><span className="tag">DEMO QUEUE · AWAITING COMPATIBLE SKIERS</span><h2>How SkiMatch will build your group</h2><p className="muted">{student.name}&apos;s placement request is in the local demo queue. When enough compatible students are waiting for the same resort, date, and slot, the ski school will allocate them into a group. You won&apos;t need to choose a group size, other participants, or an instructor.</p><div className="compatibility-grid">{dimensions.map(([label, value, explanation]) => <div className="profile-note" key={label}><h3>{label}</h3><p>{value}</p><small>{explanation}</small></div>)}</div>
      <div className="background-step"><span className="eyebrow">FUTURE BACKGROUND AGENT STEP</span><h3>Instructor matching happens in the background.</h3><p>An agent will use the group&apos;s student profiles to match an appropriate instructor. Instructor assignment is pending; no agent has run in this demo.</p></div>
      <p className="privacy-note">This is a prepared placement profile, not a confirmed group, instructor assignment, or real reservation. Group composition and background-agent matching are future backend work.</p>
      <div className="next-cta"><button className="button secondary" onClick={onRevise}>Revise my placement</button><button className="button primary" onClick={onNew}>Plan another lesson ↗</button></div>
    </section></div>
  </div>;
}
