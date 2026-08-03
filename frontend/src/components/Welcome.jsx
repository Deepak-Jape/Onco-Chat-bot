/* Empty-state welcome screen, ported from web_app.py's welcomeHtml(). */

const SUGGESTIONS = [
  "List all ADC trials of the last 10 years including their endpoints",
  "Show me recruiting Phase 3 trials for NSCLC KRAS",
  "Where are the sites for NSCLC trials?",
  "What is eligibility criteria for trial NCT03706690",
];

export default function Welcome({ onPick }) {
  return (
    <div className="welcome">
      <h2>What can I help with?</h2>
      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="suggestion" onClick={() => onPick(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
