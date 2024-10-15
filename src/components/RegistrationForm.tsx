// components/RegistrationForm.tsx
"use client";
import React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string; // optional field
  eventId: string;
  paymentType: "QR" | "Cash"; // update as necessary
}

const RegistrationForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          eventId: data.eventId,
          paymentType: data.paymentType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = (await response.json()) as Record<string, unknown>;
      console.log("Registration successful:", result);
    } catch (error) {
      console.error(
        "Unexpected error:",
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-lg flex-col gap-6 rounded-lg bg-white p-8 shadow-lg"
    >
      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          First Name:
        </label>
        <input
          type="text"
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("firstName", { required: "First name is required" })}
        />
        {errors.firstName && (
          <p className="text-sm text-red-500">{errors.firstName.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          Last Name:
        </label>
        <input
          type="text"
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("lastName", { required: "Last name is required" })}
        />
        {errors.lastName && (
          <p className="text-sm text-red-500">{errors.lastName.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold text-gray-700">Email:</label>
        <input
          type="email"
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^@]+@[^@]+\.[^@]+$/,
              message: "Invalid email format",
            },
          })}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          Phone Number:
        </label>
        <input
          type="tel"
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("phoneNumber", {
            required: "Phone number is required",
            minLength: {
              value: 9,
              message: "Phone number must be at least 9 digits",
            },
            pattern: {
              value: /^\d+$/,
              message: "Phone number must be numeric",
            },
          })}
        />
        {errors.phoneNumber && (
          <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          Event ID:
        </label>
        <input
          type="text"
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("eventId", { required: "Event ID is required" })}
        />
        {errors.eventId && (
          <p className="text-sm text-red-500">{errors.eventId.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          Payment Method:
        </label>
        <select
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("paymentType", { required: true })}
        >
          <option value="QR">QR</option>
          <option value="Cash">Cash</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-indigo-600 p-2 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Submit
      </button>
    </form>
  );
};

export default RegistrationForm;
