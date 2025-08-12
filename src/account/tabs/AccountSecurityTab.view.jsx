import React from "react";

export default function AccountSecurityTab({ sessions, onRevokeSession, onRevokeAll }) {
  return (
    <>
      <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800 }}>Aktywne sesje/urządzenia</div>
        <button className="btn" onClick={onRevokeAll}>Wyloguj wszędzie</button>
      </div>

      <div className="panel" style={{ display: "grid", gap: 8, padding: 0 }}>
        {sessions?.length === 0 && <div className="card" style={{ padding: 12 }}>Brak znanych sesji.</div>}
        {sessions?.map(s => (
          <div key={s.id} className="card" style={{ padding: 12, display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{s.isCurrent ? "Ta przeglądarka" : "Urządzenie"}</strong>
              <small className="muted">{s.createdAt}</small>
            </div>
            <div className="grid-2" style={{ gap: 4 }}>
              <KV k="IP" v={s.ip} />
              <KV k="UA" v={s.ua} />
              <KV k="Ostatnia aktywność" v={s.lastActive} />
            </div>
            {!s.isCurrent && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => onRevokeSession(s.id)}>Wyloguj tę sesję</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function KV({ k, v }) {
  return (
    <div className="card" style={{ padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span className="muted">{k}</span>
      <span>{v || "—"}</span>
    </div>
  );
}
