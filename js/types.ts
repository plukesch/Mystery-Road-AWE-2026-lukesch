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

// demo 7: form der gespeicherten hypothesen-entwuerfe (workspace.ts).
// Partial<HypothesisDraft> beim einlesen benutzt, weil ein aus localStorage
// geladenes objekt (moeglicherweise von hand editiert/veraltet) nicht
// garantiert alle felder hat.
export interface HypothesisDraft {
  suspectId: string;
  nature: string;
  evidenceIds: string[];
  confidence: string;
  explanation: string;
  alternative: string;
  savedAt: string;
}

// demo 5/6 hatten hier ein "AppStateShape"-interface als provisorium, solange
// state.js selbst noch nicht typisiert war. demo 7 konvertiert state.js zu
// state.ts (das jetzt sein eigenes, vollstaendiges "AppState"-interface hat)
// -> dieses provisorium ist ueberholt und wurde entfernt.
