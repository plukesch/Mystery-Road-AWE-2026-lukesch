import { navigateTo, type ViewName } from "../../shared/navigation";

interface HowToItemData {
  viewName: ViewName;
  heading: string;
  description: string;
  buttonLabel: string;
}

// 1:1 aus index.html's statischem ".intro-card"-markup uebernommen (das lag
// dort NICHT in "#dashboardContent" und wurde nie von renderDashboard()
// erzeugt - reiner statischer text). hier als daten-array statt 4x
// hand-kopiertem jsx-block, siehe UE3 Demo 7 F1 (lesbarkeits-/struktur-
// kriterium fuer eigene komponenten).
const HOWTO_ITEMS: HowToItemData[] = [
  {
    viewName: "evidence",
    heading: "1. Evidence Catalogue",
    description:
      "Search, filter, and sort every evidence item. Open one for full details, related people and locations, and to add a private note.",
    buttonLabel: "Go to Evidence",
  },
  {
    viewName: "people",
    heading: "2. People & Locations",
    description:
      "Read profiles and statements from the six team members involved, and look up the six key locations in the investigation.",
    buttonLabel: "Go to People & Locations",
  },
  {
    viewName: "timeline",
    heading: "3. Timeline",
    description:
      "Walk through events in chronological order, filter by person, location, or type, and jump straight to the evidence behind any event.",
    buttonLabel: "Go to Timeline",
  },
  {
    viewName: "workspace",
    heading: "4. Investigator Workspace",
    description:
      "Your bookmarked evidence and notes collect here. Draft a hypothesis — who you suspect, why, and how confident you are — it's saved automatically in your browser.",
    buttonLabel: "Go to Workspace",
  },
];

export function IntroCard() {
  return (
    <div className="intro-card">
      <h3>How to use this portal</h3>
      <p>
        Everything gathered on the case so far is organised into four working views. Use the
        navigation bar at the top to move between them at any time.
      </p>
      <div className="howto-grid">
        {HOWTO_ITEMS.map((item) => (
          <div className="howto-item" key={item.viewName}>
            <h4>{item.heading}</h4>
            <p>{item.description}</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => navigateTo(item.viewName)}
            >
              {item.buttonLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
