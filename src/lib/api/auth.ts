import { apiFetch } from "./client";


import type { Workspace } from "./workspaces";

export interface MeResponse {
  user: AuthUser;
  workspaces: Workspace[];
}


export interface OtpTimers {
  resendIn: number;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export const loginUser = (body: { email: string; password: string }) =>
  apiFetch<{ user: AuthUser }>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const logoutUser = () =>
  apiFetch<{ loggedOut: boolean }>("/v1/auth/logout", { method: "POST" });


export const registerUser = (body: { name: string; email: string; password: string }) =>
  apiFetch<{ email: string } & OtpTimers>("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const verifyOtp = (body: { email: string; code: string }) =>
  apiFetch<{ verified: boolean }>("/v1/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const resendOtp = (body: { email: string }) =>
  apiFetch<{ sent: boolean } & OtpTimers>("/v1/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const forgotPassword = (body: { email: string }) =>
  apiFetch<{ sent: boolean } & OtpTimers>("/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const requestEmailChange = (body: { newEmail: string; password: string }) =>
  apiFetch<{ email: string } & OtpTimers>("/v1/auth/change-email/request", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const confirmEmailChange = (body: { code: string }) =>
  apiFetch<{ email: string }>("/v1/auth/change-email/confirm", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const resetPassword =(body: { email: string; code: string; newPassword: string }) =>
  apiFetch<{ reset: boolean }>("/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
