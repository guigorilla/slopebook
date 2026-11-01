"use client";
import { useState } from "react";
import Link from "next/link";
import { adminAppUrl } from "../lib/app-links";
import { Home } from "./home";
import { MountainMark, Mountain } from "./mountain";
import { Conversation } from "./conversation";
import { BookingAgent } from "./booking-agent";
import { LessonProfile, formatDate } from "./lesson-profile";
import { InstructorAvatar, InstructorCard } from "./instructor-card";
import { NextLesson } from "./next-lesson";
import { GroupPlacement } from "./group-placement";
import { instructors } from "../data/instructors";
import { newRequest, queueGroupPlacement, studentFollowup, instructorFollowup, createStudentAssessment, createInstructorAssessment } from "../lib/conversation";
import { matchInstructors } from "../lib/matching";
import { buildProgress, updateLearnedProfile } from "../lib/learning";
import { profileText } from "../lib/profile";
import { BookingRequest, GroupPlacementRequest, CustomerAnswer, Instructor, Lesson, Student, StudentLessonAssessment, InstructorLessonAssessment, LESSON_SLOTS, LEVEL_LABELS } from "../types/domain";

type Screen = "home" | "booking" | "matches" | "group" | "booked" | "checkins" | "student" | "instructor" | "next";
export default function SkiMatch() {
  const [screen, setScreen] = useState<Screen>("home");
  const [request, setRequest] = useState<BookingRequest>(() => newRequest());
  const [chatVersion, setChatVersion] = useState(0);
  const [pool, setPool] = useState(instructors);
  const [placementQueue, setPlacementQueue] = useState<GroupPlacementRequest[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [studentFeedback, setStudentFeedback] = useState<StudentLessonAssessment[]>([]);
  const [instructorFeedback, setInstructorFeedback] = useState<InstructorLessonAssessment[]>([]);
  const [draft, setDraft] = useState<Record<string, CustomerAnswer>>({});
  const [previousInstructor, setPreviousInstructor] = useState<Instructor | null>(null);
  const [carried, setCarried] = useState(false);
  const instructor = pool.find(i => i.id === lesson?.instructorId);
  function navigate(to: Screen) { setScreen(to); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function start(student?: Student) {
    const fresh = newRequest(student);
    fresh.id = `request-${chatVersion + 1}`;
    if (!student) fresh.student = { ...fresh.student, id: `student-${chatVersion + 1}` };
    if (student) {
      // Retain prior language while letting every field be confirmed or changed.
      fresh.answers = {
        name: { commentary: student.name }, age: { commentary: student.ageCommentary || String(student.age) },
        ability: { selectedOption: LEVEL_LABELS[student.ability.level], commentary: student.ability.commentary },
        experience: { commentary: student.experience }, terrain: student.terrain, goals: student.goals,
        confidence: student.confidence, learningPreferences: student.learningPreferences,
        specialConsiderations: { commentary: student.specialConsiderations },
      };
    }
    setRequest(fresh); setChatVersion(v => v + 1); setCarried(!!student);
    setLesson(null); setStudentFeedback([]); setInstructorFeedback([]); setDraft({}); navigate("booking");
  }
  function revise() { setChatVersion(v => v + 1); navigate("booking"); }
  function finishBooking() {
    if (request.kind === "group") {
      const queued = queueGroupPlacement({ ...request, id: `GP-${String(chatVersion).padStart(4, "0")}` });
      setPlacementQueue(queue => [...queue.filter(r => r.id !== request.id), queued]);
      setRequest(queued); navigate("group");
    } else {
      setPlacementQueue(queue => queue.filter(r => r.id !== request.id));
      navigate("matches");
    }
  }
  function book(chosen: Instructor) {
    if (request.kind !== "private") return;
    setLesson({ id: `SM-${String(chatVersion).padStart(4, "0")}`, request: { ...request, id: `request-${chatVersion}` }, instructorId: chosen.id, status: "booked" });
    setPreviousInstructor(chosen); navigate("booked");
  }
  function openCheckin(kind: "student" | "instructor") { setDraft({}); navigate(kind); }
  function finishCheckin() {
    if (!lesson) return;
    if (screen === "student") setStudentFeedback([createStudentAssessment(lesson.id, lesson.request.student.id, draft)]);
    else setInstructorFeedback([createInstructorAssessment(lesson.id, lesson.request.student.id, draft)]);
    setDraft({}); navigate("checkins");
  }
  function showNext() {
    if (!lesson || !instructor || !studentFeedback[0] || !instructorFeedback[0]) return;
    const updated = updateLearnedProfile(instructor, lesson.request.student, studentFeedback[0], instructorFeedback[0]);
    setPool(p => p.map(i => i.id === instructor.id ? updated : i)); navigate("next");
  }
  const allCheckedIn = studentFeedback.length === 1 && instructorFeedback.length === 1;
  const matches = screen === "matches" ? matchInstructors(request, pool) : [];

  return <div className="app-shell">
    <header className="site-header">
      <button className="brand" onClick={() => navigate("home")} aria-label="SkiMatch home"><MountainMark/><span>SkiMatch<span className="brand-dot">.</span></span></button>
      <nav aria-label="Main navigation"><Link href={adminAppUrl} style={{ fontSize: 12, color: "var(--green)" }}>Manager console</Link><button onClick={() => { navigate("home"); setTimeout(() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }), 100); }}>How it works</button><span className="demo-badge">INTERACTIVE PROTOTYPE</span><button className="nav-cta" onClick={() => start()}>{screen === "home" ? "Find my instructor ↗" : "New lesson ↗"}</button></nav>
    </header>
    <main>
      {screen === "home" && <Home onStart={() => start()}/>}
      {screen === "booking" && <div className="workspace">
        <div className="page-heading"><div className="eyebrow">YOUR MOUNTAIN DAY, MADE PERSONAL</div><h1>{request.kind === "group" ? "Find your place on the mountain." : "Let's find your kind of lesson."}</h1><p>Tell me however you&apos;d describe it — you don&apos;t need to know the ski-school terminology.</p></div>
        {carried && <div className="carry-note">↻ Your updated student profile comes with you. Confirm or change anything as we plan the next lesson.</div>}
        {request.kind === "group" && <div className="carry-note">We&apos;ll match you with skiers of similar ability, goals, and learning style. One student enters the placement queue; the ski school will compose the group.</div>}
        <div className="booking-layout"><BookingAgent key={chatVersion} profile={request} onProfile={setRequest} onComplete={finishBooking}/><LessonProfile request={request} openAI/></div>
      </div>}
      {screen === "group" && request.kind === "group" && <GroupPlacement request={request} queueLength={placementQueue.length} onRevise={revise} onNew={() => start()}/>}
      {screen === "matches" && request.kind === "private" && <div className="workspace">
        <div className="page-heading"><div className="eyebrow">A HUMAN CONNECTION, THOUGHTFULLY MATCHED</div><h1>Meet your mountain people.</h1><p>Available for your day. Right for your level. Matched to what matters to you.</p></div>
        <div className="match-summary"><span>{request.resort}</span><span>{formatDate(request.requestedDate)}</span><span>{LESSON_SLOTS[request.slot].label}</span><span>Private lesson · {request.student.name}</span></div>
        <div className="match-explainer"><p>◇ {matches.length} recommendations from 8 fictional profiles. Scores reflect rule-based fit, not a guarantee.</p><button className="text-button" onClick={revise}>Revise my request</button></div>
        {matches.length ? <div className="matches-grid">{matches.map((m, i) => <InstructorCard key={m.instructor.id} match={m} index={i} onSelect={() => book(m.instructor)}/>)}</div> : <div className="card empty-state"><h2>{request.student.ability.level === "unknown" ? "Let's learn a little more about the skiing." : "No eligible instructors for this lesson."}</h2><p>{request.student.ability.level === "unknown" ? "Your original words are saved. Tell us which runs feel comfortable so our demo can suggest a level, or choose a level yourself." : "Try a different resort, date, or lesson slot. We never relax hard constraints to fill a recommendation."}</p><button className="button primary" onClick={revise}>Revise my request</button></div>}
      </div>}
      {screen === "booked" && lesson && instructor && <div className="workspace booking-confirmed">
        <div className="confirmation-art"><Mountain compact/><span className="confirmation-check">✓</span></div>
        <div className="page-heading"><div className="eyebrow">YOUR NEXT GREAT DAY ON SNOW</div><h1>It&apos;s a match.</h1><p>Your simulated private lesson with {instructor.name.split(" ")[0]} is booked. No real reservation has been made.</p></div>
        <section className="confirmation-card card"><div className="instructor-intro"><InstructorAvatar instructor={instructor}/><div><h2>{instructor.name}</h2><p>{lesson.request.resort}</p></div><span className="tag green">DEMO BOOKING</span></div><dl className="confirmation-details"><div><dt>Date</dt><dd>{formatDate(lesson.request.requestedDate)}</dd></div><div><dt>Lesson slot</dt><dd>{LESSON_SLOTS[lesson.request.slot].label}</dd></div><div><dt>Lesson</dt><dd>Private instructor lesson</dd></div><div><dt>Student</dt><dd>{lesson.request.student.name}</dd></div></dl><p className="muted">Demo reference {lesson.id}</p></section>
        <div className="demo-action"><span className="eyebrow">EXPLORE THE LEARNING LOOP</span><h2>What happens after the last run?</h2><p>Fast-forward to the end of the lesson and see how both perspectives make the next one better.</p><button className="button primary" onClick={() => { setLesson({ ...lesson, status: "completed" }); navigate("checkins"); }}>Simulate completed lesson <span>→</span></button></div>
      </div>}
      {screen === "checkins" && lesson && <div className="workspace checkin-page">
        <div className="page-heading"><div className="eyebrow">THE LAST RUN ISN&apos;T THE END OF THE STORY</div><h1>Two perspectives.<br/>A better next lesson.</h1><p>{lesson.request.student.name}&apos;s demo lesson is complete. Try each role separately. We keep both perspectives.</p></div>
        <div className="checkin-grid">{(["student", "instructor"] as const).map(kind => { const done = (kind === "student" ? studentFeedback : instructorFeedback).length === 1; return <section className="card checkin-card" key={kind}><div className="checkin-symbol">{kind === "student" ? "↗" : "⌁"}</div><span className="eyebrow">{kind.toUpperCase()} PERSPECTIVE</span><h2>{kind === "student" ? "Student check-in" : "Instructor check-in"}</h2><p>{kind === "student" ? "What clicked? What felt challenging? Tell us about the day in your own words." : "Capture technical progress, terrain comfort, and what would help next time."}</p><div className="checkin-status">{done ? "Perspective saved" : "Ready when you are"}</div><button className={`button full ${done ? "secondary" : "primary"}`} disabled={done} onClick={() => openCheckin(kind)}>{done ? "✓ Check-in complete" : `Start ${kind} check-in →`}</button></section>; })}</div>
        <div className="next-cta"><p>{allCheckedIn ? "Both perspectives are ready. Let's put them to work." : "Complete both check-ins to unlock the next lesson plan."}</p><button className="button primary" disabled={!allCheckedIn} onClick={showNext}>See your next lesson <span>↗</span></button></div>
      </div>}
      {(screen === "student" || screen === "instructor") && lesson && <div className="workspace">
        <div className="page-heading"><div className="eyebrow">LEARNING FROM BOTH PERSPECTIVES</div><h1>{screen === "student" ? "How was your mountain day?" : "What did you see on snow?"}</h1><p>Answer as the {screen} · {lesson.request.student.name}</p></div>
        <div className="booking-layout"><Conversation key={screen} title={`${screen === "student" ? "Student" : "Instructor"} check-in`} subtitle={`About ${lesson.request.student.name}'s lesson`} questions={screen === "student" ? studentFollowup : instructorFollowup} onAnswer={(q, a) => setDraft(d => ({ ...d, [q.key]: a }))} finishLabel="Save this check-in" onComplete={finishCheckin}/><aside className="profile card"><div className="eyebrow">ONE LESSON. TWO PERSPECTIVES.</div><h2>{lesson.request.student.name}</h2><p>{LEVEL_LABELS[lesson.request.student.ability.level]} · age {lesson.request.student.age}</p><div className="profile-note"><h3>Original goal</h3><p>{profileText(lesson.request.student.goals)}</p></div><div className="profile-note"><h3>Lesson with {instructor?.name}</h3><p>{lesson.request.resort}<br/>{formatDate(lesson.request.requestedDate)} · {LESSON_SLOTS[lesson.request.slot].label}</p></div><div className="privacy-note">Your selections and your words are saved as a separate {screen} assessment.</div><button className="text-button" onClick={() => navigate("checkins")}>← Back to check-ins (discard unsaved answers)</button></aside></div>
      </div>}
      {screen === "next" && lesson && instructor && previousInstructor && <div className="workspace"><NextLesson lesson={lesson} instructor={instructor} previousInstructor={previousInstructor} feedback={studentFeedback} assessments={instructorFeedback} onNext={() => start(buildProgress(lesson.request.student, studentFeedback[0], instructorFeedback[0]).student)}/></div>}
    </main>
    <footer className="site-footer"><span className="brand"><MountainMark/>SkiMatch.</span><p>Better connections. Better mountain days.</p><span>Local demo · Refresh resets your session</span></footer>
  </div>;
}
