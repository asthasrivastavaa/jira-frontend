import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(60, "At most 60 characters"),
  slug: z
    .string()
    .min(3, "At least 3 characters")
    .max(40, "At most 40 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only"),
});
export type WorkspaceValues = z.infer<typeof workspaceSchema>;
export const slugSchema = workspaceSchema.shape.slug;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
