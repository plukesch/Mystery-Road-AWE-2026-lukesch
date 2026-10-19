import type { MouseEvent } from "react";
import type { Evidence } from "../../../js/types";
import { formatDate } from "../../../js/utils";
import { Badge } from "../../shared/Badge";
import { StatusBadge } from "../../shared/StatusBadge";
import { RelevanceBadge } from "./RelevanceBadge";

interface EvidenceCardProps {
  evidence: Evidence;
  isBookmarked: boolean;
  onToggleBookmark: (evidenceId: string) => void;
  onOpen: (evidenceId: string) => void;
}

// eine karte im katalog (renderEvidenceCardHTML() in vanilla). PRESENTATIONAL:
// sie weiss nicht, wo die bookmarks liegen oder wie ein detail geoeffnet wird -
// sie meldet nur "der nutzer hat auf den stern / die karte geklickt".
// ue5 demo 1 - ZWEI click-handler, direkt an den elementen, an denen sie
// passieren:
//  - onClick auf dem stern-button (vanilla: data-action="bookmark" + ein
//    EINZIGER listener am container, der per event.target.closest() rausfand,
//    welcher button gemeint war)
//  - onClick auf der karte (vanilla: derselbe container-listener, zweiter ast)
export function EvidenceCard({
  evidence,
  isBookmarked,
  onToggleBookmark,
  onOpen,
}: EvidenceCardProps) {
  // der stern sitzt IN der karte. ohne stopPropagation wuerde derselbe klick
  // nach oben "durchblubbern" und zusaetzlich das detail oeffnen - in vanilla
  // hiess das event.stopPropagation() im container-listener, der erste ast
  // kehrt vor dem karten-ast zurueck. auch in react bubbelt das event.
  function handleBookmarkClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onToggleBookmark(evidence.id);
  }

  return (
    <div className="evidence-card" onClick={() => onOpen(evidence.id)}>
      <button
        type="button"
        className={`bookmark-btn${isBookmarked ? " active" : ""}`}
        aria-label={`Toggle bookmark for ${evidence.title}`}
        onClick={handleBookmarkClick}
      >
        <span className="bookmark-icon">{isBookmarked ? "★" : "☆"}</span>
      </button>
      <h3>{evidence.title}</h3>
      <div className="evidence-meta">
        {evidence.id} &middot; {evidence.type} &middot; {formatDate(evidence.timestamp)}
      </div>
      <div className="evidence-summary">{evidence.summary}</div>

      {evidence.tags.includes("critical") && <Badge variant="critical">Critical</Badge>}
      <StatusBadge status={evidence.status} />
      <RelevanceBadge relevance={evidence.relevance} />
      <div>
        {evidence.tags.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
