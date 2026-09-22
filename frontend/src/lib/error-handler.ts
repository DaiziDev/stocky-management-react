import { isApiError } from "@/api/interceptors";

/**
 * Central error handling (P1.4) — used by the react-query
 * QueryCache/MutationCache onError hooks in app/providers.tsx so every failed
 * query/mutation surfaces a consistent message, unless a caller opts out via
 * mutation `meta.handled: true` (e.g. forms that map errors inline).
 */

/** Message shown to the user for any thrown error. */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 0)
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    // The backend's own message always wins (e.g. "Stock insuffisant pour
    // l'article X") — a hardcoded per-status string would hide it.
    if (error.message && error.message.trim()) return error.message;
    if (error.status === 401)
      return "Votre session a expiré. Reconnectez-vous.";
    if (error.status === 403)
      return "Vous n’avez pas les droits nécessaires pour cette action.";
    return "Une erreur inattendue est survenue";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Une erreur inattendue est survenue";
}

/** Backend field errors → flat map for RHF `setError` (e.g. { email: '...' }). */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (isApiError(error) && error.errors) {
    return Object.fromEntries(
      Object.entries(error.errors).map(([field, messages]) => [
        field,
        messages[0],
      ]),
    );
  }
  return {};
}

/** Whether a mutation error was already surfaced inline (skip global toast). */
export function isHandledError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "handled" in error &&
    (error as { handled?: unknown }).handled === true
  );
}
