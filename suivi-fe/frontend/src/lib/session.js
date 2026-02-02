// src/lib/session.js
const KEY = "fe_profile";

export function setProfile(p) {
  localStorage.setItem(KEY, JSON.stringify(p || null));
}

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function clearProfile() {
  localStorage.removeItem(KEY);
}
