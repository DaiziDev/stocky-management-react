import axios from "axios";

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

/**
 * NOTE — no `PaginatedResponse`/`ApiResponse` envelopes here: every list
 * endpoint in swagger v1.0 returns a bare array and every write returns the
 * DTO directly. If the backend adds pagination later, model it next to the
 * swagger contract, not here.
 */

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error &&
    "timestamp" in error
  );
};

/**
 * Backend error body — Spring Boot typically answers errors with either a
 * bare message string or an object carrying `message` (and optionally
 * field-level `errors`). Both shapes are unwrapped below.
 */
interface BackendErrorBody {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Human-readable message for UI display (banners, toasts).
 *
 * For an AxiosError the backend's own message (e.g. "Identifiants invalides")
 * always wins over axios boilerplate ("Request failed with status code 403"),
 * so backend error copy reaches the user verbatim. Non-HTTP failures fall
 * back to the error's own message; the final fallback is generic by design.
 */
export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as BackendErrorBody | string | undefined;
    if (typeof body === "string" && body.trim()) return body;
    if (body && typeof body === "object") {
      if (typeof body.message === "string" && body.message.trim())
        return body.message;
      if (typeof body.error === "string" && body.error.trim())
        return body.error;
    }
    return error.message;
  }
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur inattendue est survenue";
};

export const extractFieldErrors = (error: unknown): Record<string, string> => {
  if (isApiError(error) && error.errors) {
    const fieldErrors: Record<string, string> = {};
    Object.entries(error.errors).forEach(([field, messages]) => {
      fieldErrors[field] = messages[0];
    });
    return fieldErrors;
  }
  return {};
};
