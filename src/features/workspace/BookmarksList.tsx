import { Link } from "react-router";
import type { Evidence } from "../../../js/types";
import { evidencePath } from "../../shared/routes";

interface BookmarksListProps {
  items: Evidence[];
}

// die liste der gemerkten beweisstuecke (renderBookmarksList() in vanilla).
// PRESENTATIONAL. ue5 demo 1: der "Open"-button ist KEIN eigener handler mehr.
// vanilla: addEventListener("click") pro button -> navigateTo("evidence") ->
// setTimeout(() => openEvidenceDetail(id), 0). hier: ein <Link> auf
// /evidence?open=<id> - der router navigiert, die evidence-seite liest die id
// aus der URL und zeigt das detail. kein setTimeout, kein handler.
export function BookmarksList({ items }: BookmarksListProps) {
  return (
    <div className="bookmarks-list">
      {items.length === 0 ? (
        <p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>
      ) : (
        items.map((item) => (
          <div className="mini-list-item" key={item.id}>
            <strong>{item.id}</strong> &mdash; {item.title}{" "}
            <Link className="btn btn-small btn-secondary" to={evidencePath(item.id)}>
              Open
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
