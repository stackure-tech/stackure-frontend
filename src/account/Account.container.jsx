import React, { useEffect, useMemo, useState, useCallback } from "react";
import AccountView from "./Account.view";
import {
  fetchMe, updateProfile, changePassword,
  fetchBilling, changePlan, cancelSub, resumeSub,
  fetchPaymentMethod, setPaymentMethod,
  fetchSessions, revokeSession, revokeAllSessions,
  fetchNotifications, updateNotifications,
  requestExport, requestDeleteAccount,
  fetchConsents, updateConsents,
  fetchIntegrationStatus
} from "./accountApi";
import { isEmail, sanitizeText, validatePassword } from "./validators";

/** Kontener logiki – placeholdery API + walidacje */
export default function AccountContainer() {
  const [activeTab, setActiveTab] = useState("profile"); // 'profile'|'billing'|'security'|'privacy'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [me, setMe] = useState(null);
  const [billing, setBilling] = useState(null);
  const [paymentMethod, setPM] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotif] = useState(null);
  const [consents, setConsents] = useState(null);
  const [integrations, setIntegrations] = useState({ backend: false, stripe: false });

  // Ładowanie danych startowych (mock/placeholder)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [me_, bill_, pm_, sess_, notif_, cons_, integ_] = await Promise.all([
          fetchMe(), fetchBilling(), fetchPaymentMethod(),
          fetchSessions(), fetchNotifications(), fetchConsents(), fetchIntegrationStatus()
        ]);
        if (!mounted) return;
        setMe(me_); setBilling(bill_); setPM(pm_); setSessions(sess_);
        setNotif(notif_); setConsents(cons_); setIntegrations(integ_);
      } catch (e) {
        setError(e?.message || "Błąd ładowania danych");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // PROFILE
  const onSaveProfile = useCallback(async (payload) => {
    const name = sanitizeText(payload?.name, 60);
    const email = (payload?.email || "").trim().toLowerCase();

    if (!name || name.length < 2) return { ok: false, msg: "Nazwa: min. 2 znaki." };
    if (!isEmail(email)) return { ok: false, msg: "Nieprawidłowy e-mail." };

    try {
      setSaving(true);
      const updated = await updateProfile({ name, email });
      setMe((m) => ({ ...m, ...updated }));
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Nie udało się zapisać profilu." };
    } finally { setSaving(false); }
  }, []);

  const onChangePassword = useCallback(async ({ current, next, confirm }) => {
    if (!validatePassword(next)) return { ok: false, msg: "Hasło: ≥12 znaków, złożone." };
    if (next !== confirm) return { ok: false, msg: "Hasła nie są zgodne." };
    try {
      setSaving(true);
      await changePassword({ current, next });
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Zmiana hasła nieudana." };
    } finally { setSaving(false); }
  }, []);

  // BILLING
  const onChangePlan = useCallback(async (priceId) => {
    try {
      setSaving(true);
      const sub = await changePlan({ priceId, email: me?.email });
      setBilling((b) => ({ ...b, ...sub }));
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Zmiana planu nieudana." };
    } finally { setSaving(false); }
  }, [me?.email]);

  const onCancel = useCallback(async () => {
    try {
      setSaving(true);
      const sub = await cancelSub();
      setBilling((b) => ({ ...b, ...sub }));
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Anulowanie nieudane." };
    } finally { setSaving(false); }
  }, []);

  const onResume = useCallback(async () => {
    try {
      setSaving(true);
      const sub = await resumeSub();
      setBilling((b) => ({ ...b, ...sub }));
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Wznowienie nieudane." };
    } finally { setSaving(false); }
  }, []);

  const onSetPaymentMethod = useCallback(async () => {
    try {
      setSaving(true);
      const pm = await setPaymentMethod({ email: me?.email, returnUrl: (typeof window!=="undefined"?window.location.href:undefined) });
      setPM(pm);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Aktualizacja metody płatności nieudana." };
    } finally { setSaving(false); }
  }, [me?.email]);

  // SECURITY
  const onRevokeSession = useCallback(async (id) => {
    try {
      setSaving(true);
      await revokeSession(id);
      setSessions((list) => list.filter((s) => s.id !== id));
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Nie udało się wylogować sesji." };
    } finally { setSaving(false); }
  }, []);

  const onRevokeAll = useCallback(async () => {
    try {
      setSaving(true);
      await revokeAllSessions();
      setSessions((list) => list.filter((s) => s.isCurrent)); // zostaw bieżącą
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Nie udało się wylogować wszystkich." };
    } finally { setSaving(false); }
  }, []);

  // PRIVACY / NOTIFICATIONS
  const onUpdateNotifications = useCallback(async (next) => {
    try {
      setSaving(true);
      const saved = await updateNotifications(next);
      setNotif(saved);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Zapis powiadomień nieudany." };
    } finally { setSaving(false); }
  }, []);

  const onExport = useCallback(async () => {
    try {
      const res = await requestExport();
      return { ok: true, msg: `Zlecono eksport #${res.requestId}. Link przyjdzie e-mailem.` };
    } catch (e) {
      return { ok: false, msg: e?.message || "Nie udało się zlecić eksportu." };
    }
  }, []);

  const onDeleteAccount = useCallback(async () => {
    try {
      const res = await requestDeleteAccount();
      return { ok: true, msg: res?.msg || "Wysłano kod potwierdzenia na e-mail." };
    } catch (e) {
      return { ok: false, msg: e?.message || "Nie udało się zainicjować usunięcia konta." };
    }
  }, []);

  const onUpdateConsents = useCallback(async (next) => {
    try {
      setSaving(true);
      const saved = await updateConsents(next);
      setConsents(saved);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e?.message || "Zapis zgód nieudany." };
    } finally { setSaving(false); }
  }, []);

  const viewProps = useMemo(() => ({
    activeTab, setActiveTab,
    loading, saving, error, integrations,
    me, onSaveProfile, onChangePassword,
    billing, paymentMethod, onChangePlan, onCancel, onResume, onSetPaymentMethod,
    sessions, onRevokeSession, onRevokeAll,
    notifications, onUpdateNotifications,
    onExport, onDeleteAccount,
    consents, onUpdateConsents
  }), [
    activeTab, loading, saving, error, integrations,
    me, billing, paymentMethod, sessions, notifications, consents
  ]);

  return <AccountView {...viewProps} />;
}
