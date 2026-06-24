import { z } from "zod";
import { APP_ROLES } from "@/lib/constants";

export const inviteUserSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    fullName: z.string().min(1, "Full name is required"),
    role: z.enum(APP_ROLES),
    ngoId: z.string().uuid().optional().or(z.literal("")),
  })
  .refine((data) => data.role !== "ngo_partner" || !!data.ngoId, {
    message: "Select an NGO for the ngo_partner role",
    path: ["ngoId"],
  });

export type InviteUserValues = z.infer<typeof inviteUserSchema>;
