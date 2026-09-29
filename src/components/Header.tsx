// reines branding - kein routing/state hier. spiegelbild von index.html's
// ".brand"-div. bekommt bewusst keine props: logo/titel/untertitel sind fest,
// nicht von aussen konfigurierbar.
export function Header() {
  return (
    <div className="brand">
      <img src="assets/logo/logo.svg" alt="Project ReMotion logo" className="brand-logo" />
      <div>
        <h1>Project ReMotion</h1>
        <p className="subtitle">Investigate the failure of an AI-assisted rehabilitation robot.</p>
      </div>
    </div>
  );
}
