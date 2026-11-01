import { Instructor, Lesson, StudentLessonAssessment, InstructorLessonAssessment, LEVEL_LABELS, LESSON_SLOTS } from "../types/domain";
import { profileText } from "../lib/profile";
import { buildProgress } from "../lib/learning";
import { InstructorAvatar } from "./instructor-card";
export function NextLesson({ lesson, instructor, previousInstructor, feedback, assessments, onNext }: {
    lesson: Lesson;
    instructor: Instructor;
    previousInstructor: Instructor;
    feedback: StudentLessonAssessment[];
    assessments: InstructorLessonAssessment[];
    onNext: () => void;
}) {
    return <div className="next-page">
    <div className="page-heading">
    <div className="eyebrow">EVERY LESSON IS A NEW STARTING POINT</div>
    <h1>Your next lesson.</h1>
    <p>A little more confidence. A clearer path forward. Here&apos;s what your next mountain day could look like.</p>
    </div>
    <div className="loop-strip">
    <span>01 &nbsp; Your story</span>
    <b>→</b>
    <span>02 &nbsp; A matched lesson</span>
    <b>→</b>
    <span>03 &nbsp; Both perspectives</span>
    <b>→</b>
    <strong>04 &nbsp; A better next lesson</strong>
    </div>
    {[lesson.request.student].map(student => {
            const f = feedback.find(f => f.studentId === student.id)!;
            const a = assessments.find(a => a.studentId === student.id)!;
            const p = buildProgress(student, f, a);
            return <section key={student.id} className="progress-card card">
            <div className="progress-student">
            <span className="initial">{student.name[0]}</span>
            <div>
            <div className="eyebrow">UPDATED SKIING PROFILE · AGE {student.age}</div>
            <h2>{student.name}&apos;s next chapter</h2>
            </div>
            <span className="tag green">{LEVEL_LABELS[p.student.ability.level]}</span>
            </div>
            <div className="progress-grid">
            <div>
            <h3>Look how far you&apos;ve come</h3>
            <p>{p.progress}</p>
            <div className="profile-note">
            <strong>Ability</strong>
            <p>{p.previousAbility} → {LEVEL_LABELS[p.student.ability.level]}</p>
            <small>Instructor assessment, not a promised level increase.</small>
            </div>
            <div className="profile-note">
            <strong>Confidence</strong>
            <p>{profileText(student.confidence)} → {profileText(p.student.confidence)}</p>
            </div>
            <div className="profile-note">
            <strong>Your strengths</strong>
            <p>{p.strengths}</p>
            </div>
            </div>
            <div>
            <h3>Make your next turns count</h3>
            <div className="recommendation">
            <span>01</span>
            <div>
            <strong>Skills to build</strong>
            <p>{p.nextSkills}</p>
            <small>Keep working on: {a.technicalWeaknesses}</small>
            </div>
            </div>
            <div className="recommendation">
            <span>02</span>
            <div>
            <strong>Terrain & practice</strong>
            <p>{p.practice}</p>
            <small>Observed comfort: {a.terrainComfort}</small>
            </div>
            </div>
            <div className="recommendation">
            <span>03</span>
            <div>
            <strong>Your next lesson</strong>
            <p>{p.lessonType} · {LESSON_SLOTS[p.slot].label}</p>
            <small>Instructor characteristics: {p.instructorCharacteristics}</small>
            </div>
            </div>{p.caution && <p className="mismatch">
                <strong>A note for next time</strong>{p.caution}</p>}</div>
            </div>
            <details>
            <summary>Both perspectives, preserved</summary>
            <div className="perspective-grid">
            <div>
            <h4>Student check-in</h4>{Object.entries(f).filter(([k]) => !["lessonId", "studentId", "responses"].includes(k)).map(([k, v]) => <p key={k}>
                <strong>{label(k)}:</strong> {String(v)}</p>)}</div>
            <div>
            <h4>Instructor check-in</h4>{Object.entries(a).filter(([k]) => !["lessonId", "studentId", "responses"].includes(k)).map(([k, v]) => <p key={k}>
                <strong>{label(k)}:</strong> {String(v)}</p>)}</div>
            </div>
            </details>
            </section>;
        })}
    <section className="learned-card card">
    <div className="section-heading">
    <div className="instructor-intro">
    <InstructorAvatar instructor={instructor}/>
    <div>
    <div className="eyebrow">THE LEARNING GOES BOTH WAYS</div>
    <h2>{instructor.name}&apos;s learned profile</h2>
    </div>
    </div>
    <span className="tag green">{previousInstructor.learnedProfile.outcomeCount} → {instructor.learnedProfile.outcomeCount} observations</span>
    </div>
    <p className="muted">Your feedback adds evidence for future matching. One lesson is an observation, not a proven trend.</p>
    <div className="learning-grid">{[
            ["Successful student types", "successfulStudentTypes"], ["Recurring strengths", "recurringStrengths"], ["Situations to watch", "lessEffectiveSituations"], ["Student feedback & observations", "commonFeedback"],
        ].map(([title, key]) => {
            const field = key as "successfulStudentTypes" | "recurringStrengths" | "lessEffectiveSituations" | "commonFeedback";
            const before = previousInstructor.learnedProfile[field];
            const added = instructor.learnedProfile[field].filter(v => !before.includes(v));
            return <div key={key}>
            <h3>{title}</h3>
            <p className="before-label">BEFORE</p>{before.map(v => <p key={v} className="previous-observation">{v}</p>)}<p className="before-label">AFTER THIS LESSON</p>{added.length ? added.map(v => <p key={v} className="new-observation">+ {v}</p>) : <p>No new positive evidence in this category. Existing observations retained.</p>}</div>;
        })}</div>
    </section>
    <div className="next-cta">
    <div>
    <h2>Pick up where you left off.</h2>
    <p>Your updated student profiles come with you. Choose a new mountain day.</p>
    </div>
    <button className="button primary" onClick={onNext}>Find my next lesson <span>↗</span>
    </button>
    </div>
  </div>;
}
function label(key: string) { return key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()); }
