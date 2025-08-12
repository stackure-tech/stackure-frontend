// src/account/tabs/AccountBillingTab.view.jsx
import React from "react";

// Stałe ID cen z Stripe (LIVE)
const PRICE_ID_ADFREE = "price_1RvFwDGWRK3NdFgxnG64PjQy";
const PRICE_ID_PREMIUM = "price_1RvFwWGWRK3NdFgxWXpVAx1G";

export default function AccountBillingTab({
  integrations, billing, paymentMethod,
  onChangePlan, onCancel, onResume, onSetPaymentMethod,
  me
}) {
  const disabled = !integrations?.stripe;
  const changeTo = (priceId) => onChangePlan(priceId);

  return (
    <>
      <div className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Plan i status</div>
        <div className="grid-2" style={{ gap: 8 }}>
          <KV k="Plan" v={labelPlan(billing?.plan)} />
          <KV k="Status" v={labelStatus(billing?.status)} />
          <KV k="Odnowienie/koniec" v={billing?.currentPeriodEnd || "—"} />
          {billing?.trialEnd && <KV k="Trial do" v={billing.trialEnd} />}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" disabled={disabled} onClick={() => changeTo(PRICE_ID_ADFREE)}>Zmień na Ad-Free</button>
          <button className="btn" disabled={disabled} onClick={() => changeTo(PRICE_ID_PREMIUM)}>Zmień na Premium</button>
          <button className="btn" disabled={disabled || billing?.status !== "active"} onClick={onCancel}>Anuluj</button>
          <button className="btn" disabled={disabled || billing?.status !== "canceled"} onClick={onResume}>Wznów</button>
        </div>
        {disabled && <small className="muted">Podłącz Stripe (backend + webhooki) – przyciski są w trybie demo.</small>}
      </div>

      <div className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Domyślna metoda płatności</div>
        <div className="grid-2" style={{ gap: 8 }}>
          <KV k="Typ" v={paymentMethod?.pmType || "—"} />
          <KV k="Karta" v={paymentMethod?.brand ? `${paymentMethod.brand} •••• ${paymentMethod.last4}` : "—"} />
          <KV k="Ważna do" v={paymentMethod?.exp ? `${paymentMethod.exp.month}/${paymentMethod.exp.year}` : "—"} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn"
            disabled={disabled}
            onClick={() => onSetPaymentMethod({ email: me?.email, returnUrl: window.location.href })}
          >
            Zmień/ustaw metodę
          </button>
        </div>
        <small className="muted">Uwaga: P24/BLIK zwykle jednorazowe – domyślna metoda dotyczy kart/wallet.</small>
      </div>
    </>
  );
}

function KV({ k, v }) {
  return (
    <div className="card" style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div className="muted">{k}</div>
      <div style={{ fontWeight: 700 }}>{v}</div>
    </div>
  );
}
function labelPlan(p) { if (p === "adfree") return "Ad-Free"; if (p === "premium") return "Premium"; return "Free"; }
function labelStatus(s) { const map = { active:"aktywna", canceled:"anulowana", past_due:"zaległa", incomplete:"niekompletna" }; return map[s] || "—"; }
