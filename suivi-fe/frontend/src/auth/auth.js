const KEY = "suivi_fe_session_v1";

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function isManager() {
  return getSession()?.role === "manager";
}

export function isQualiticien() {
  return getSession()?.role === "qualiticien";
}

export function getUserName() {
  return getSession()?.name || "";
}
