import { Instructor, InstructorMatch, LEVEL_LABELS, LESSON_SLOTS } from "../types/domain";
export function InstructorAvatar({ instructor, large = false }: {
    instructor: Instructor;
    large?: boolean;
}) {
    return <div className={`instructor-avatar ${instructor.color} ${large ? "large" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 100 110">
    <path d="M12 110c0-30 15-44 38-44s38 14 38 44" fill="currentColor" opacity=".75"/>
    <ellipse cx="50" cy="44" rx="23" ry="28" fill="#edccaf"/>
    <path d="M25 36c-2-28 48-34 50-1L70 42H29Z" fill="currentColor"/>
    <rect x="24" y="29" width="52" height="18" rx="8" fill="#183e40"/>
    <rect x="29" y="33" width="20" height="9" rx="4" fill="#bad0cf"/>
    <rect x="52" y="33" width="18" height="9" rx="4" fill="#bad0cf"/>
    <path d="M43 59q7 5 14 0" fill="none" stroke="#a5715c" strokeWidth="2"/>
    <path d="m35 75 15 17 15-17" fill="none" stroke="#f5efdf" strokeWidth="3"/>
    </svg>
    </div>;
}
export function InstructorCard({ match, index, onSelect }: {
    match: InstructorMatch;
    index: number;
    onSelect: () => void;
}) {
    const i = match.instructor;
    return <article className={`instructor-card card ${index === 0 ? "best-match" : ""}`}>
    <div className="match-card-top">
    <span className="eyebrow">{index === 0 ? "YOUR CLOSEST MATCH" : "ANOTHER GREAT POSSIBILITY"}</span>
    <span className="match-score">{match.score}<small>/100 fit</small>
    </span>
    </div>
    <div className="instructor-intro">
    <InstructorAvatar instructor={i} large/>
    <div>
    <h2>{i.name}</h2>
    <p>{i.yearsTeaching} years making mountain days</p>
    <p className="rating">★ {i.rating} <span>· {i.lessonsTaught.toLocaleString()} lessons</span>
    </p>
    </div>
    </div>
    <p className="bio">{i.biography}</p>
    <div className="pills">{i.teachingStyle.map(s => <span key={s}>{s}</span>)}</div>
    <h3 className="why-label">Why you might click</h3>
    <ul className="match-reasons">{match.reasons.map(r => <li key={r}>
        <span>✓</span>{r}</li>)}</ul>
    {match.mismatch && <p className="mismatch">
        <strong>Worth discussing</strong>{match.mismatch}</p>}
    <details className="instructor-details">
    <summary>Profile & match breakdown</summary>
    <dl>
    <div>
    <dt>Certifications</dt>
    <dd>{i.certifications.join(", ")}</dd>
    </div>
    <div>
    <dt>Resorts</dt>
    <dd>{i.resorts.join(", ")}</dd>
    </div>
    <div>
    <dt>Ages & levels</dt>
    <dd>{i.ageGroups.join("–")} · {i.levels.map(l => LEVEL_LABELS[l]).join(", ")}</dd>
    </div>
    <div>
    <dt>Specialties</dt>
    <dd>{i.specialties.join(", ")}</dd>
    </div>
    <div>
    <dt>Terrain</dt>
    <dd>{i.terrainExpertise.join(", ")}</dd>
    </div>
    <div>
    <dt>Communication</dt>
    <dd>{i.communicationStyle.join(", ")}</dd>
    </div>
    <div>
    <dt>Lesson types</dt>
    <dd>{i.lessonTypes.join(", ")}</dd>
    </div>
    <div>
    <dt>Languages</dt>
    <dd>{i.languages.join(", ")}</dd>
    </div>
    <div>
    <dt>Availability</dt>
    <dd>{i.availability.weekdays.length === 7 ? "Every day" : "Weekdays"}; {i.availability.slots.map(s => LESSON_SLOTS[s].label).join(" / ")}</dd>
    </div>
    </dl>
      <h4>How this score works</h4>
    <p>50 points for satisfying every hard constraint, plus:</p>{match.breakdown.map(b => <div className="score-row" key={b.category}>
        <span>{b.category}</span>
        <strong>{b.points}/{b.possible}</strong>
        </div>)}
      <h4>Learned profile · fictional seed data</h4>
    <p>
    <strong>Successful with:</strong> {i.learnedProfile.successfulStudentTypes.join("; ")}</p>
    <p>
    <strong>Recurring strengths:</strong> {i.learnedProfile.recurringStrengths.join("; ")}</p>
    <p>
    <strong>Less effective with:</strong> {i.learnedProfile.lessEffectiveSituations.join("; ")}</p>
    <p>
    <strong>Student feedback:</strong> {i.learnedProfile.commonFeedback.join("; ")}</p>
    </details>
    <button className={`button full ${index === 0 ? "primary" : "secondary"}`} onClick={onSelect}>Choose {i.name.split(" ")[0]} <span>↗</span>
    </button>
  </article>;
}
