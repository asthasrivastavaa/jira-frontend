import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
});
export type RegisterValues = z.infer<typeof registerSchema>;
export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const inviteRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
});
export type InviteRegisterValues = z.infer<typeof inviteRegisterSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your current password"),
});
export type ChangeEmailValues = z.infer<typeof changeEmailSchema>;

export const forgotSchema = z.object({
  email: z.email("Enter a valid email address"),
});
export type ForgotValues = z.infer<typeof forgotSchema>;

export const resetSchema = z.object({
  newPassword: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
});
export type ResetValues = z.infer<typeof resetSchema>;

export function getPasswordStrength(pw: string) {
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  if (!pw) return { score: 0, label: "" };
  let points = 0;
  if (pw.length >= 8) points++;
  if (pw.length >= 12) points++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++;
  if (/\d/.test(pw)) points++;
  if (/[^A-Za-z0-9]/.test(pw)) points++;
  const score = pw.length < 8 ? 1 : Math.min(points, 4);
  return { score, label: labels[score] };
}
