import React from "react";

/** Czysty UI modala – bez logiki */
export default function EditCargoModalView({
  open, edit, onClose, onChange, onSave,
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
      }}
    >
      <div className="panel" style={{ width: 520, maxWidth: "92vw", borderRadius: 20, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 className="h3" style={{ fontSize: 16 }}>Edytuj ładunek</h3>
          <button type="button" onClick={onClose} className="btn" style={{ background: "transparent", color: "var(--fg)", border: "1px solid var(--border)" }}>✕</button>
        </div>

        {/* Nazwa */}
        <div style={{ marginBottom: 10 }}>
          <label className="label" style={{ marginBottom: 4 }}>Nazwa</label>
          <input
            className="input kbd-focus"
            type="text"
            value={edit.name ?? ""}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="np. Box 12"
          />
        </div>

        {/* Wymiary */}
        <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 10 }}>
          {[
            ["length", "Długość (cm)"],
            ["width",  "Szerokość (cm)"],
            ["height", "Wysokość (cm)"],
          ].map(([k, label]) => (
            <label key={k} className="label" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>{label}</span>
              <input
                className="input kbd-focus"
                type="number"
                min={0}
                value={edit[k] ?? ""}
                onChange={e => onChange({ [k]: +e.target.value })}
              />
            </label>
          ))}
        </div>

        {/* Kolor */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" style={{ marginBottom: 6 }}>Kolor</label>
          <input
            type="color"
            value={edit.color ?? "#0051ff"}
            onChange={e => onChange({ color: e.target.value })}
            style={{ width: 64, height: 38, padding: 4, borderRadius: 12, border: "1px solid var(--border)", background: "transparent" }}
          />
        </div>

        {/* Akcje */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} className="btn" style={{ background: "transparent", color: "var(--fg)", border: "1px solid var(--border)" }}>
            Anuluj
          </button>
          <button className="btn" onClick={onSave}>Zapisz</button>
        </div>
      </div>
    </div>
  );
}
