import React from "react";
import ProfileTab from "./tabs/AccountProfileTab.view";
import BillingTab from "./tabs/AccountBillingTab.view";
import SecurityTab from "./tabs/AccountSecurityTab.view";
import PrivacyTab from "./tabs/AccountPrivacyTab.view";

/** Czysty UI profilu + nawigacja zakładek (spójny styl) */
export default function AccountView(props) {
  const {
    activeTab, setActiveTab,
    loading, saving, error, integrations
  } = props;

  const tabs = [
    { key: "profile", label: "Profil konta" },
    { key: "billing", label: "Subskrypcja i płatności" },
    { key: "security", label: "Bezpieczeństwo" },
    { key: "privacy", label: "Dane, prywatność i powiadomienia" },
  ];

  return (
    <div className="panel" style={{ width: "100%", height: "100%", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <header className="card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="badge">Profil</span>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Ustawienia konta</div>
        </div>
        {saving ? <span className="badge-weak">⏳ Zapisywanie…</span> : null}
      </header>

      {/* Alerty integracyjne */}
      {!integrations?.backend && (
        <div className="card" style={{ padding: 12, border: "1px dashed var(--border)", background: "var(--surface-2)" }}>
          <strong>Brak backendu API.</strong> Akcje zapisu są symulowane (placeholder). Skonfiguruj endpointy `/api/*`.
        </div>
      )}
      {!integrations?.stripe && (
        <div className="card" style={{ padding: 12, border: "1px dashed var(--border)", background: "var(--surface-2)" }}>
          <strong>Stripe niepodłączony.</strong> Sekcja „Subskrypcja i płatności” działa w trybie demonstracyjnym. Dodaj klucze i ceny (price IDs).
        </div>
      )}
      {error && <div className="card" style={{ padding: 12, color: "crimson" }}>⚠️ {error}</div>}
      {loading && <div className="card" style={{ padding: 12 }}>Ładowanie…</div>}

      {/* Zakładki */}
      <nav className="card" style={{ display: "flex", gap: 8, padding: 8, overflowX: "auto" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="btn"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: activeTab === t.key ? "var(--fg)" : "var(--surface-2)",
              color: activeTab === t.key ? "white" : "var(--fg)",
              fontWeight: 700, whiteSpace: "nowrap"
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Treści zakładek */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {activeTab === "profile"  && <ProfileTab {...props} />}
        {activeTab === "billing"  && <BillingTab {...props} />}
        {activeTab === "security" && <SecurityTab {...props} />}
        {activeTab === "privacy"  && <PrivacyTab {...props} />}
      </section>
    </div>
  );
}
