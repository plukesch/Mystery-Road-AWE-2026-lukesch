import type { ChangeEvent, FormEvent } from "react";
import type { Evidence } from "../../../js/types";
import { formatDate } from "../../../js/utils";
import { isRelevance, isReviewStatus, type ReviewEdit } from "./evidenceHelpers";

interface EvidenceDetailProps {
  evidence: Evidence;
  personNames: string[];
  locationLabels: string[];
  note: string;
  onClose: () => void;
  onSaveNote: (evidenceId: string, text: string) => void;
  onChangeReview: (evidenceId: string, edit: ReviewEdit) => void;
}

// vanilla ruft section.scrollIntoView() direkt im oeffnen-code auf. hier: ein
// "ref-callback" - react ruft ihn einmal auf, sobald das element im DOM haengt.
// er muss eine STABILE funktion sein (modul-ebene, nicht inline im JSX): ein
// inline-callback waere bei jedem render eine neue funktion und wuerde bei jedem
// render erneut scrollen (z. B. nach "Save note"). er liest nur (scrollen),
// er veraendert keinen inhalt - eine der wenigen legitimen ausnahmen, siehe
// UE5_THEORIE_ANTWORTEN demo 10.
function scrollIntoViewOnMount(element: HTMLElement | null) {
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// das detail-panel (renderEvidenceDetail() in vanilla). PRESENTATIONAL.
// ue5 demo 1 - zwei weitere handler:
//  - "Close": onClick={onClose} statt onclick="closeEvidenceDetail()" im HTML-string
//  - "Save note": onSubmit am <form> statt onclick="saveCurrentNote()". vanilla
//    hat die evidence-id mit getAttribute("data-evidence-id") aus dem DOM
//    zurueckgelesen - hier steht sie einfach in `evidence.id` (closure).
// ue5 demo 3: die beiden dropdowns (status, relevanz) sind jetzt KONTROLLIERT
// (value + onChange) und melden eine aenderung per onChangeReview nach oben.
// diese komponente aendert das beweisstueck NIE selbst - `evidence` ist
// nur-lesen; das unveraenderliche update steht in EvidencePage/applyReviewEdits.
export function EvidenceDetail({
  evidence,
  personNames,
  locationLabels,
  note,
  onClose,
  onSaveNote,
  onChangeReview,
}: EvidenceDetailProps) {
  // der string aus dem <select> wird erst durch den type guard zu einem
  // ReviewStatus bzw. Relevance - ein unbekannter wert wird einfach ignoriert.
  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (isReviewStatus(value)) onChangeReview(evidence.id, { status: value });
  }

  function handleRelevanceChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (isRelevance(value)) onChangeReview(evidence.id, { relevance: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // ohne preventDefault() wuerde der browser das formular abschicken und die
    // seite neu laden - der submit-event ist die "default action" des formulars.
    event.preventDefault();
    const text = new FormData(event.currentTarget).get("note");
    onSaveNote(evidence.id, typeof text === "string" ? text : "");
  }

  return (
    <section className="evidence-detail" ref={scrollIntoViewOnMount}>
      <div className="evidence-detail-header">
        <div>
          <h2>{evidence.title}</h2>
          <div className="evidence-meta">
            {evidence.id} &middot; {evidence.type} &middot; {formatDate(evidence.timestamp)}
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>
          Close
        </button>
      </div>

      {evidence.tags.includes("critical") && (
        <div className="warning-banner">This item is tagged as critical evidence.</div>
      )}

      <div className="detail-field">
        <strong>Summary</strong>
        {evidence.summary}
      </div>
      <div className="evidence-detail-content">{evidence.content}</div>
      <div className="detail-field">
        <strong>Related people</strong>
        {personNames.join(", ")}
      </div>
      <div className="detail-field">
        <strong>Related locations</strong>
        {locationLabels.join(", ")}
      </div>
      <div className="detail-field">
        <strong>Tags</strong>
        {evidence.tags.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className="detail-field">
        <strong>Review status</strong>
        <select
          id="detailStatusSelect"
          value={evidence.status.toLowerCase()}
          onChange={handleStatusChange}
        >
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>
      <div className="detail-field">
        <strong>Relevance</strong>
        <select
          id="detailRelevanceSelect"
          value={evidence.relevance.toLowerCase()}
          onChange={handleRelevanceChange}
        >
          <option value="unknown">Unknown</option>
          <option value="relevant">Relevant</option>
          <option value="irrelevant">Irrelevant</option>
        </select>
      </div>

      <div className="detail-field">
        <strong>Investigator note</strong>
        <form onSubmit={handleSubmit}>
          <textarea
            name="note"
            className="note-textarea"
            rows={3}
            defaultValue={note}
            placeholder="Add a private note about this evidence..."
          />
          <button type="submit" className="btn btn-primary btn-small" style={{ marginTop: 6 }}>
            Save note
          </button>
        </form>
      </div>

      <div className="detail-field">
        <strong>Note preview</strong>
        <div id="notePreview">{note}</div>
      </div>
    </section>
  );
}
