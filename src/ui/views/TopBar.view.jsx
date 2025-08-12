import React from "react";

/** Czysty UI topbara – dopasowany do stylu Stackure */
export default function TopBarView({ ThemeToggleSlot }) {
  return (
    <header
      className="card"
      style={{
        width: "100%",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderRadius: 20,
        marginBottom: 8,
        background: "linear-gradient(180deg, var(--surface), #f9fafb)",
      }}
    >
      <img src="https://stackure.tech/logo192.png" alt="Stackure logo" style={{ height: 36 }} />
      <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: .2 }}>Stackure 3D Load Planner</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Link do profilu */}
        <a
          href="#/account"
          className="btn"
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px",
            borderRadius: 999,
            background: "var(--fg)",
            color: "white",
            textDecoration: "none",
            boxShadow: "0 8px 20px #00000022",
            fontWeight: 800
          }}
          aria-label="Profil użytkownika"
          title="Profil użytkownika"
        >
          <div
            style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "linear-gradient(145deg, var(--accent), #d9feb0)",
              display: "grid", placeItems: "center", color: "var(--accent-ink)",
              fontSize: 14, fontWeight: 900
            }}
          >
            U
          </div>
          <span>User</span>
        </a>

        {ThemeToggleSlot}
      </div>
    </header>
  );
}
