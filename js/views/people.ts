// ---------------------------------------------------------------------
// PEOPLE & LOCATIONS VIEW
// ---------------------------------------------------------------------
// demo 7 (ue2): konvertiert.
import state from "../state.js";
import { countEvidenceForPerson } from "../lookup.js";
import { navigateTo } from "../navigation.js";
import { renderEvidenceList } from "./evidence.js";
import { requireElement } from "../dom.js";

// window-export (index.html: onclick="switchPeopleTab('people')")
export function switchPeopleTab(tab: string): void {
  state.currentPeopleTab = tab;
  const peoplePanel = requireElement("peoplePanel");
  const locationsPanel = requireElement("locationsPanel");
  const peopleTabBtn = requireElement("tabPeopleBtn");
  const locationsTabBtn = requireElement("tabLocationsBtn");

  if (tab === "people") {
    peoplePanel.classList.remove("hidden");
    locationsPanel.classList.add("hidden");
    peopleTabBtn.classList.add("active");
    locationsTabBtn.classList.remove("active");
  } else {
    peoplePanel.classList.add("hidden");
    locationsPanel.classList.remove("hidden");
    peopleTabBtn.classList.remove("active");
    locationsTabBtn.classList.add("active");
  }
}

export function renderPeople(): void {
  const container = requireElement("peoplePanel");
  let html = "";
  for (const person of state.allPeople) {
    const count = countEvidenceForPerson(person);

    html += '<div class="person-card">';
    html += '<div class="person-card-header">';
    html +=
      '<img class="person-avatar" src="' +
      person.avatar +
      '" alt="Portrait of ' +
      person.name +
      '">';
    html +=
      "<div><h3>" + person.name + '</h3><div class="person-role">' + person.role + "</div></div>";
    html += "</div>";
    html += "<p><strong>Speciality:</strong> " + person.speciality + "</p>";
    html += "<ul>";
    for (const responsibility of person.responsibilities) {
      html += "<li>" + responsibility + "</li>";
    }
    html += "</ul>";
    html += '<div class="person-statement">&ldquo;' + person.statement + "&rdquo;</div>";
    html += "<p>" + count + " related evidence item" + (count === 1 ? "" : "s") + " &mdash; ";
    html +=
      '<button type="button" class="evidence-count-link" data-person-id="' +
      person.id +
      '">view</button></p>';
    html += "</div>";
  }
  container.innerHTML = html;

  const links = container.querySelectorAll(".evidence-count-link");
  for (const link of links) {
    // demo 10: click-callback + setTimeout-callback als arrows (lesen e.target, kein `this`)
    link.addEventListener("click", (e) => {
      const personId = (e.target as HTMLElement).getAttribute("data-person-id") || "";
      requireElement<HTMLSelectElement>("filterPerson").value = personId;
      navigateTo("evidence");
      setTimeout(() => renderEvidenceList(), 0);
    });
  }
}

export function renderLocations(): void {
  const container = requireElement("locationsPanel");
  let html = "";
  for (const loc of state.allLocations) {
    html += '<div class="location-card">';
    html += "<h3>" + loc.id + " &mdash; " + loc.name + "</h3>";
    html += "<p>" + loc.description + "</p>";
    html += "<p><strong>Contains:</strong></p><ul>";
    for (const item of loc.contains) {
      html += "<li>" + item + "</li>";
    }
    html += "</ul></div>";
  }
  container.innerHTML = html;
}
