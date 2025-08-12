import React, { useState } from "react";

export default function AccountProfileTab({ me, onSaveProfile, onChangePassword }) {
  const [form, setForm] = useState({ name: me?.name || "", email: me?.email || "" });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const res = await onSaveProfile(form);
    setMsg(res.ok ? "Zapisano profil." : res.msg);
  };

  const changePwd = async (e) => {
    e.preventDefault();
    const res = await onChangePassword(pwd);
    setMsg(res.ok ? "Hasło zmienione." : res.msg);
    if (res.ok) setPwd({ current: "", next: "", confirm: "" });
  };

  return (
    <>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Dane profilu</div>
        <form onSubmit={save} className="grid-2" style={{ gap: 12 }}>
          <LabeledText label="Nazwa" value={form.name} onChange={v => setForm({ ...form, name: v })} maxLength={60} required />
          <LabeledText label="Adres e-mail" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" required />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button className="btn" type="submit" style={{ fontWeight: 800 }}>Zapisz</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Zmień hasło</div>
        <form onSubmit={changePwd} className="grid-2" style={{ gap: 12 }}>
          <LabeledText label="Obecne hasło" value={pwd.current} onChange={v => setPwd({ ...pwd, current: v })} type="password" required />
          <LabeledText label="Nowe hasło (≥12 znaków)" value={pwd.next} onChange={v => setPwd({ ...pwd, next: v })} type="password" required />
          <LabeledText label="Potwierdź nowe hasło" value={pwd.confirm} onChange={v => setPwd({ ...pwd, confirm: v })} type="password" required />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button className="btn" type="submit" style={{ fontWeight: 800 }}>Zmień hasło</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="grid-2" style={{ gap: 8 }}>
          <ReadOnlyField label="Data rejestracji" value={me?.createdAt || "—"} />
          <ReadOnlyField label="Ostatnie logowanie" value={me?.lastLoginAt || "—"} />
        </div>
      </div>

      {msg && <div className="card" style={{ padding: 12 }}>ℹ️ {msg}</div>}
    </>
  );
}

function LabeledText({ label, value, onChange, type = "text", maxLength, required }) {
  return (
    <label className="field">
      <div className="field-label">{label}</div>
      <input
        className="field-input"
        type={type}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder=""
      />
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <label className="field">
      <div className="field-label">{label}</div>
      <input className="field-input" value={value} readOnly />
    </label>
  );
}
