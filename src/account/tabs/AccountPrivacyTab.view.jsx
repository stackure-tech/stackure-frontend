import React, { useState } from "react";

export default function AccountPrivacyTab({
  notifications, onUpdateNotifications,
  onExport, onDeleteAccount,
  consents, onUpdateConsents
}) {
  const [msg, setMsg] = useState(null);
  const [notif, setNotif] = useState(notifications || { billingEmails: true, productNews: false, frequency: "instant" });
  const [cons, setCons] = useState(consents || { marketing: false, cookies: true, ads: false });

  const saveNotif = async () => {
    const res = await onUpdateNotifications(notif);
    setMsg(res.ok ? "Zapisano preferencje powiadomień." : res.msg);
  };
  const saveCons = async () => {
    const res = await onUpdateConsents(cons);
    setMsg(res.ok ? "Zapisano zgody." : res.msg);
  };
  const doExport = async () => {
    const res = await onExport();
    setMsg(res.msg || (res.ok ? "Zlecono eksport." : "Niepowodzenie."));
  };
  const doDelete = async () => {
    if (!window.confirm("Na pewno chcesz usunąć konto? To nieodwracalne.")) return;
    const res = await onDeleteAccount();
    setMsg(res.msg || (res.ok ? "Sprawdź e-mail – kod potwierdzenia." : "Niepowodzenie."));
  };

  return (
    <>
      <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 800 }}>Powiadomienia e-mail</div>
        <div className="grid-2" style={{ gap: 8 }}>
          <Toggle label="Płatności/faktury/zmiany planu" checked={notif.billingEmails} onChange={v => setNotif({ ...notif, billingEmails: v })} />
          <Toggle label="Nowości produktowe" checked={notif.productNews} onChange={v => setNotif({ ...notif, productNews: v })} />
          <Select label="Częstotliwość" value={notif.frequency} onChange={v => setNotif({ ...notif, frequency: v })} options={[
            { value: "instant", label: "Natychmiast" },
            { value: "weekly", label: "Raz w tygodniu" },
          ]} />
        </div>
        <div><button className="btn" onClick={saveNotif}>Zapisz powiadomienia</button></div>
      </div>

      <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 800 }}>Zgody i prywatność</div>
        <div className="grid-2" style={{ gap: 8 }}>
          <Toggle label="Zgody marketingowe" checked={cons.marketing} onChange={v => setCons({ ...cons, marketing: v })} />
          <Toggle label="Cookies (niezbędne)" checked={cons.cookies} onChange={v => setCons({ ...cons, cookies: v })} disabled />
          <Toggle label="Personalizacja reklam" checked={cons.ads} onChange={v => setCons({ ...cons, ads: v })} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={saveCons}>Zapisz zgody</button>
          <button className="btn" onClick={doExport}>Eksport danych (ZIP)</button>
          <button className="btn" onClick={doDelete} style={{ background: "#ffe8e8", color: "#a30000" }}>Usuń konto</button>
        </div>
        <small className="muted">
          Kontakt RODO: <a href="mailto:connect@stackure.tech">connect@stackure.tech</a>. Zobacz politykę prywatności.
        </small>
      </div>

      {msg && <div className="card" style={{ padding: 12 }}>ℹ️ {msg}</div>}
    </>
  );
}

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label className="card" style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: disabled ? .6 : 1 }}>
      <span>{label}</span>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <div className="field-label">{label}</div>
      <select className="field-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
