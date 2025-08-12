export function isEmail(email) {
  if (typeof email !== "string") return false;
  const v = email.trim().toLowerCase();
  // Prosty, szybki RFC-ish
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

export function sanitizeText(s, max = 120) {
  if (typeof s !== "string") return "";
  // Trim + usuwanie znaków sterujących
  const clean = s.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return clean.slice(0, max);
}

export function validatePassword(pwd) {
  if (typeof pwd !== "string" || pwd.length < 12) return false;
  // minimum: litera + cyfra lub znak spec
  const hasLetter = /[A-Za-z]/.test(pwd);
  const hasOther = /[\d\W_]/.test(pwd);
  return hasLetter && hasOther;
}
