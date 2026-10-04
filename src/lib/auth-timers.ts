export type OtpPurpose = "verify" | "reset";

// "verify" keeps the original key, so existing sessions keep working
const key = (email: string, purpose: OtpPurpose) =>
  purpose === "verify" ? `otp-timers:${email}` : `otp-timers:${purpose}:${email}`;

export function saveOtpTimers(
  email: string,
  t: { resendIn: number; expiresIn: number },
  purpose: OtpPurpose = "verify",
) {
  try {
    sessionStorage.setItem(
      key(email, purpose),
      JSON.stringify({
        resendAt: Date.now() + t.resendIn * 1000,
        expiresAt: Date.now() + t.expiresIn * 1000,
      }),
    );
  } catch {}
}

export function loadOtpTimers(email: string, purpose: OtpPurpose = "verify") {
  try {
    const raw = sessionStorage.getItem(key(email, purpose));
    return raw ? (JSON.parse(raw) as { resendAt: number; expiresAt: number }) : null;
  } catch {
    return null;
  }
}
