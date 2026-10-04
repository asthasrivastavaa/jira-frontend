import "server-only";
import { cache } from "react";
import { apiFetch } from "@/lib/api/server";
import type { MeResponse } from "@/lib/api/auth";

// One /auth/me call per request, shared by the layout and every page under it
export const getMe = cache(() => apiFetch<MeResponse>("/v1/auth/me"));
