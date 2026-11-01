import { BookingRequest, Student, CustomerAnswer, LEVEL_LABELS, LESSON_SLOTS } from "../types/domain";
import { profileText } from "../lib/profile";
export function formatDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set yet";
}
export function StudentProfile({ student }: { student: Student }) {
  const fields: [string, CustomerAnswer & { structured?: string[] }][] = [
    ["Terrain", student.terrain], ["Goals", student.goals], ["Confidence", student.confidence], ["Learning preferences", student.learningPreferences],
  ];
  return <div className="student-full-profile"><div className="student-preview"><span className="initial">{student.name[0] || "?"}</span><div><h3>{student.name || "Your skier"}{student.age > 0 && <span> · age {student.age}</span>}</h3><p>{LEVEL_LABELS[student.ability.level]}{student.ability.source === "inferred" ? " · inferred from description" : ""}</p></div></div>
    {(student.ability.commentary || student.ability.selectedOption) && <div className="profile-note"><h3>Ability — in your words</h3><p>{profileText(student.ability)}</p>{student.ability.source === "unresolved" && <small>We&apos;ll keep this unresolved until there&apos;s enough information.</small>}</div>}
    {fields.filter(([, f]) => f.selectedOption || f.commentary).map(([title, field]) => <div key={title} className="profile-note"><h3>{title}</h3><p>{profileText(field)}</p>{!!field.structured?.length && <div className="pills">{field.structured.map(v => <span key={v}>{v.replaceAll("_", " ")}</span>)}</div>}</div>)}
    {student.experience && <div className="profile-note"><h3>Experience</h3><p>{student.experience}</p></div>}
    {student.specialConsiderations && <div className="profile-note"><h3>Considerations</h3><p>{student.specialConsiderations}</p></div>}
  </div>;
}
export function LessonProfile({ request, openAI = false }: { request: BookingRequest; openAI?: boolean }) {
  const answered = request.answers;
  return <aside className="profile card"><div className="eyebrow">BUILT AROUND ONE SKIER</div><h2>{request.kind === "group" ? "Group placement profile" : "Lesson profile"}</h2><p className="muted">Your words and your skiing profile, side by side.</p>
    <dl className="profile-details"><div><dt>Experience</dt><dd>{answered.kind ? request.kind === "group" ? "Ski-school group placement" : "Private instructor lesson" : "Let's find out"}</dd></div><div><dt>Mountain</dt><dd>{answered.resort ? request.resort : "Your choice"}</dd></div><div><dt>Date</dt><dd>{formatDate(request.requestedDate)}</dd></div><div><dt>Lesson slot</dt><dd>{answered.slot ? LESSON_SLOTS[request.slot].label : "To be decided"}</dd></div></dl>
    {request.student.name && <StudentProfile student={request.student}/>}
    {request.kind === "private" && profileText(request.instructorPreferences) !== "Not shared yet" && <div className="profile-note"><h3>Instructor preferences</h3><p>{profileText(request.instructorPreferences)}</p></div>}
    {request.additionalInformation && <div className="profile-note"><h3>Also on your mind</h3><p>{request.additionalInformation}</p></div>}
    <div className="privacy-note">{openAI ? "◇ Booking messages and this profile are sent to OpenAI through our server. The prototype keeps your session in memory; refreshing resets it." : "◇ Local prototype. Your session is kept in memory in this browser and resets when you refresh."}</div>
  </aside>;
}
