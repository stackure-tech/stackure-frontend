// src/account/accountApi.js
/** Produkcyjny API-layer dla panelu konta + Stripe.
 *  Backend:
 *   - GET    {API_BASE}/api/integration-status
 *   - POST   {API_BASE}/api/billing/change-plan   { priceId, email? }
 *   - POST   {API_BASE}/api/billing/payment-method { email?, returnUrl? }
 *  Konfiguracja: VITE_API_BASE (opcjonalnie) – np. "https://api.stackure.tech"
 */
const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) || "";
const JSON_HEADERS = { "Content-Type": "application/json" };

// Mały helper z timeoutem
async function apiFetch(path, opts = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...opts, signal: ctrl.signal });
    if (!res.ok) {
      const txt = await res.text().catch(()=>"");
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  } finally {
    clearTimeout(id);
  }
}

// ===== Integrations / Health =====
export async function fetchIntegrationStatus() {
  try {
    const data = await apiFetch("/api/integration-status", { method: "GET" });
    return { backend: !!data.backend, stripe: !!data.stripe };
  } catch {
    return { backend: false, stripe: false };
  }
}

// ===== Profile / Security (placeholder – zostają) =====
const delay = (ms = 250) => new Promise(r => setTimeout(r, ms));
export async function fetchMe() {
  await delay();
  return { id:"usr_demo_1", name:"Użytkownik Stackure", email:"user@example.com",
           createdAt:"2025-08-01 10:00", lastLoginAt:"2025-08-12 09:42" };
}
export async function updateProfile({ name, email }) { await delay(); return { name, email }; }
export async function changePassword({ current, next }) { await delay(); if(!current||!next) throw new Error("Brak danych hasła."); return { ok:true }; }

// ===== Billing (Stripe) =====
/** Zmiana/zakup planu – tworzy Stripe Checkout Session i przekierowuje. */
export async function changePlan({ priceId, email }) {
  if (!priceId) throw new Error("Brak priceId.");
  const body = JSON.stringify({ priceId, email });
  const { url } = await apiFetch("/api/billing/change-plan", { method:"POST", headers: JSON_HEADERS, body });
  if (typeof window !== "undefined" && url) window.location.href = url;
  return {};
}

/** Ustawienie/zmiana metody – Stripe Billing Portal i przekierowanie. */
export async function setPaymentMethod({ email, returnUrl } = {}) {
  const body = JSON.stringify({ email, returnUrl });
  const { url } = await apiFetch("/api/billing/payment-method", { method:"POST", headers: JSON_HEADERS, body });
  if (typeof window !== "undefined" && url) window.location.href = url;
  return {};
}

// ===== Reszta placeholderów, aby UI działało spójnie =====
export async function fetchBilling() { await delay(); return { plan:"free", status:"active", currentPeriodEnd:"—", trialEnd:null }; }
export async function cancelSub() { await delay(); return { status:"canceled" }; }
export async function resumeSub() { await delay(); return { status:"active" }; }
export async function fetchPaymentMethod() { await delay(); return { pmType:"card", brand:"Visa", last4:"4242", exp:{ month:12, year:2030 } }; }
export async function fetchSessions() { await delay(); return [
  { id:"sess_cur", ip:"192.168.0.10", ua:"Chrome 138 / Windows", createdAt:"2025-08-11 20:11", lastActive:"2025-08-12 09:45", isCurrent:true },
  { id:"sess_old", ip:"87.99.12.34", ua:"Safari / iOS", createdAt:"2025-08-07 08:01", lastActive:"2025-08-07 12:40", isCurrent:false }
];}
export async function revokeSession(){ await delay(); return { ok:true }; }
export async function revokeAllSessions(){ await delay(); return { ok:true }; }
export async function fetchNotifications(){ await delay(); return { billingEmails:true, productNews:false, frequency:"instant" }; }
export async function updateNotifications(next){ await delay(); return next; }
export async function requestExport(){ await delay(); return { requestId:"exp_001" }; }
export async function requestDeleteAccount(){ await delay(); return { ok:true, msg:"Jeśli to nie test – wyślemy kod potwierdzenia na e-mail." }; }
export async function fetchConsents(){ await delay(); return { marketing:false, cookies:true, ads:false }; }
export async function updateConsents(next){ await delay(); return next; }
