type AuthErrorCode =
  | "invalid_credentials"
  | "email_already_in_use"
  | "email_not_found"
  | "email_not_confirmed"
  | "weak_password"
  | "rate_limited"
  | "network_error"
  | "unknown";

const I18N_KEYS: Record<AuthErrorCode, string> = {
  invalid_credentials: "auth.errors.invalidCredentials",
  email_already_in_use: "auth.errors.emailAlreadyInUse",
  email_not_found: "auth.errors.emailNotFound",
  email_not_confirmed: "auth.errors.emailNotConfirmed",
  weak_password: "auth.errors.weakPassword",
  rate_limited: "auth.errors.rateLimited",
  network_error: "auth.errors.networkError",
  unknown: "auth.errors.unknown",
};

export function translateAuthError(
  rawError: string | null | undefined
): AuthErrorCode {
  if (!rawError) return "invalid_credentials";
  const msg = rawError.toLowerCase();
  if (msg.includes("invalid login credentials")) return "invalid_credentials";
  if (
    msg.includes("already registered") ||
    msg.includes("already been registered")
  )
    return "email_already_in_use";
  if (msg.includes("not found") || msg.includes("user not found"))
    return "email_not_found";
  if (msg.includes("email not confirmed")) return "email_not_confirmed";
  if (msg.includes("password")) return "weak_password";
  if (msg.includes("rate") || msg.includes("too many")) return "rate_limited";
  if (msg.includes("network") || msg.includes("failed to fetch"))
    return "network_error";
  return "unknown";
}

export function authErrorKey(code: AuthErrorCode): string {
  return I18N_KEYS[code] ?? I18N_KEYS.unknown;
}