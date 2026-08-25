/** Dispatched after Profile preference/basics saves so Apply can recalculate matches. */
export const PROFILE_UPDATED_EVENT = "tpp:profile-updated";

export function notifyProfileUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}
