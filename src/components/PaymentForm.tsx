"use client";
import { useForm, SubmitHandler } from "react-hook-form";

interface FormData {
  name: string;
  email: string;
  phone: string;
  paymentMethod: "QR" | "Cash";
}

const PaymentForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // Submit handler
  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log("Form submitted:", data);
    // Add form submission logic here (API request, etc.)
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-lg flex-col gap-6 rounded-lg bg-white p-8 shadow-lg"
    >
      <div>
        <label className="mb-2 block font-semibold text-gray-700">Name:</label>
        <input
          type="text"
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
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
          {...register("phone", {
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
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold text-gray-700">
          Payment Method:
        </label>
        <select
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("paymentMethod", { required: true })}
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

export default PaymentForm;
