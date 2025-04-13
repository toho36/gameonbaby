import { z } from "zod";

// Phone number validation using a regex pattern
// This validates common international formats with optional country codes
// Czech phone numbers require at least 9 digits
export const phoneRegex = /^\+?[1-9]\d{8,14}(\s?\d{1,4}){0,4}$/;

// Name validation - must contain actual letters, at least 2 characters
export const nameRegex = /^[A-Za-z\s'-]+$/;

export const RegistrationFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name must be 30 characters or less")
    .regex(
      nameRegex,
      "First name must contain valid characters (letters, spaces, hyphens)",
    ),
  lastName: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(
      z
        .string()
        .regex(
          nameRegex,
          "Last name must contain valid characters (letters, spaces, hyphens)",
        )
        .max(30, "Last name must be 30 characters or less")
        .optional(),
    ),
  email: z
    .string()
    .min(5, "Email is required")
    .max(50, "Email must be 50 characters or less")
    .email("Please enter a valid email address")
    .refine((email) => email.includes("."), {
      message: "Email must contain a domain extension (e.g., .com)",
    }),
  phoneNumber: z
    .string()
    .min(9, "Czech phone numbers must be at least 9 digits")
    .max(20, "Phone number must be 20 characters or less")
    .regex(phoneRegex, "Please enter a valid phone number format"),
  paymentType: z.enum(["CARD", "CASH"]),
  eventId: z.string().min(1, "Event ID is required"),
});

export type RegistrationFormValues = z.infer<typeof RegistrationFormSchema>;
