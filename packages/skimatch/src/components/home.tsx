import { Mountain } from "./mountain";
export function Home({ onStart }: {
    onStart: () => void;
}) {
    return <>
    <section className="hero">
    <div className="hero-copy">
    <div className="eyebrow">
    <span className="tiny-line"/> LESS GUESSWORK. MORE MOUNTAIN.</div>
    <h1>Your mountain.<br />Your moment.<br />
    <em>Your instructor.</em>
    </h1>
    <p>A better day on snow starts with someone who gets you. Find an instructor who fits your goals, your pace, and your kind of adventure.</p>
    <button className="button primary" onClick={onStart}>Find my instructor <span>↗</span>
    </button>
    <div className="hero-proof">
    <div className="mini-faces">
    <span>EM</span>
    <span>MC</span>
    <span>SA</span>
    </div>
    <p>
    <strong>A personal fit, from the first turn.</strong>
    <br />8 fictional instructors · 3 iconic mountains</p>
    </div>
    </div>
    <div className="hero-art">
    <Mountain />
    <span className="art-coordinate">50°06′ N &nbsp; 122°57′ W</span>
    <div className="art-caption">
    <span>THE MOUNTAIN IS CALLING</span>
    <p>Make it your kind of day.</p>
    <div>Whistler Blackcomb &nbsp; / &nbsp; Alpine inspiration</div>
    </div>
    <div className="floating-note">
    <span>✧</span>
    <div>
    <strong>Great lessons start with a connection.</strong>
    <p>Not just a skill level.</p>
    </div>
    </div>
    </div>
    </section>
    <section className="resort-strip" aria-label="Demo resorts">
    <span>FIND YOUR FEET AT</span>
    <strong>WHISTLER BLACKCOMB</strong>
    <strong>VAIL <i>⌁</i>
    </strong>
    <strong>PARK CITY</strong>
    <span>THREE MOUNTAINS. YOUR WAY.</span>
    </section>
    <section className="how-section" id="how-it-works">
    <div className="section-heading">
    <div>
    <div className="eyebrow">A LITTLE CONVERSATION. A BETTER CONNECTION.</div>
    <h2>Made for your next turn.</h2>
    </div>
    <p>From your first day to your next breakthrough,<br />each lesson builds on the last.</p>
    </div>
    <div className="how-grid">{[
            ["01", "Tell us your story", "A simple conversation about your skiing, your goals, and what a great day looks like. No lengthy forms."],
            ["02", "Find your mountain match", "Book a personal instructor, or join the queue for a ski-school group built around compatible skiers."],
            ["03", "Grow with every lesson", "Share how it went. Your instructor adds their perspective. Your next lesson starts one step ahead."],
        ].map(([number, title, body]) => <article key={number}>
        <span>{number}</span>
        <h3>{title}</h3>
        <p>{body}</p>
        </article>)}</div>
    </section>
    <section className="home-bottom">
    <div>
    <span className="eyebrow">FIRST TURNS OR FRESH CHALLENGES</span>
    <h2>There&apos;s a great lesson<br />with your name on it.</h2>
    </div>
    <button className="button primary" onClick={onStart}>Find my instructor <span>↗</span>
    </button>
    </section>
  </>;
}
