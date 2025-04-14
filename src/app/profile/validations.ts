import { z } from "zod";

// Phone number validation using a regex pattern
// This validates common international formats with optional country codes
// Czech phone numbers require at least 9 digits
export const phoneRegex = /^\+?[1-9]\d{8,14}(\s?\d{1,4}){0,4}$/;

// Name validation - must contain actual letters, at least 2 characters
export const nameRegex = /^[A-Za-z\s'-]+$/;

export const ProfileFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or less")
    .regex(
      nameRegex,
      "Name must contain valid characters (letters, spaces, hyphens)",
    ),
  phoneNumber: z
    .string()
    .min(9, "Czech phone numbers must be at least 9 digits")
    .max(20, "Phone number must be 20 characters or less")
    .regex(phoneRegex, "Please enter a valid phone number format"),
  image: z.string().optional().nullable(),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;
