// ---------------------------------------------------------------------
// DOMAIN-TYPEN DER FALLAKTE
// demo 6 (ue2): passend zur form von data/*.json. wird von lookup.ts,
// data.ts (und ab demo 7 dem rest der app) benutzt.
// ---------------------------------------------------------------------

// union-typen (nur mit "type" moeglich, nicht mit "interface" - siehe
// THEORIE_ANTWORTEN demo 6 F3): die erlaubten werte fuer diese felder.
export type ReviewStatus = "unreviewed" | "reviewed" | "flagged";
export type Relevance = "unknown" | "relevant" | "irrelevant";
export type Certainty = "confirmed" | "reported" | "contradictory";

export interface Evidence {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  summary: string;
  content: string;
  /**
   * demo 6 task 3 - DAS ambige feld: eigentlich immer eine Person.id
   * (z.b. "kernel-colt"), ABER E04 in evidence.json hat stattdessen den
   * ANZEIGENAMEN "Nova Byte" drinstehen statt der id "nova-byte". js hat das
   * nie entscheiden muessen: ein array von strings ist ein array von
   * strings, ob drin eine id oder ein name steht, ist ihm egal.
   * evidenceMentionsPerson() (lookup.ts) prueft deshalb explizit BEIDES.
   * typescript zwingt einen nicht automatisch, das zu bemerken (der typ
   * "string[]" ist fuer id UND name gleichermassen gueltig) - aber der
   * versuch, ein EHRLICHES interface zu schreiben, zwingt einen, sich die
   * echten daten nochmal anzuschauen und die inkonsistenz explizit
   * hinzuschreiben, statt sie stillschweigend im js-code zu verstecken.
   */
  personIds: string[];
  locationIds: string[];
  tags: string[];
  // demo 6 F2: E12 in evidence.json hat tatsaechlich "Reviewed"/"Unknown"
  // (grossgeschrieben) statt der hier erlaubten kleingeschriebenen werte.
  // dieser typ ist also die ABSICHT, nicht garantiert die realitaet -
  // typescript prueft beim einlesen der json-datei (siehe data.ts) nicht
  // nach, ob die echten werte wirklich passen. mehr dazu in F2.
  status: ReviewStatus;
  relevance: Relevance;
  /** wird erst zur laufzeit von applyStoredBookmarkFlags gesetzt - steht NICHT in der json-datei */
  bookmarked?: boolean;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  speciality: string;
  responsibilities: string[];
  statement: string;
  background: string;
  avatar: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  contains: string[];
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: string;
  certainty: Certainty;
  personIds: string[];
  locationIds: string[];
  evidenceIds: string[];
}

export interface CaseFile {
  caseId: string;
  title: string;
  subtitle: string;
  status: string;
  opened: string;
  summary: string;
  location: string;
  leadInvestigator: string;
  notes: string;
}

// demo 5/6: state.js selbst ist noch nicht typisiert (kommt in demo 7).
// bis dahin: die minimale form, die lookup.ts/data.ts von "state" brauchen,
// jetzt mit den ECHTEN domain-typen statt den demo-5-platzhaltern
// (EvidenceRecord/PersonRecord/LocationRecord) - die sind damit ueberholt.
export interface AppStateShape {
  allEvidence: Evidence[];
  filteredEvidence: Evidence[];
  allPeople: Person[];
  allLocations: Location[];
  allTimeline: TimelineEvent[];
  caseData: CaseFile;
  currentPage: string;
  evidenceViewLoading: boolean;
  loadingStepsRemaining: number;
}
