import React, { useState, useEffect } from "react";
import { UseFormRegister } from "react-hook-form";
import { RegistrationFormValues } from "~/components/validations";

interface PaymentMethodSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  register?: UseFormRegister<RegistrationFormValues>;
  name?: string;
}

export default function PaymentMethodSelector({
  value = "CARD",
  onChange,
  register,
  name = "paymentType",
}: PaymentMethodSelectorProps) {
  // For react-hook-form
  const [selectedValue, setSelectedValue] = useState("CARD");

  // Update selected value when using controlled component
  useEffect(() => {
    if (value) {
      setSelectedValue(value);
    }
  }, [value]);

  if (register) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label
          className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${
            selectedValue === "CARD"
              ? "border-purple-400 bg-purple-500/40 text-white"
              : "border-white/20 bg-white/10 text-white/80"
          }`}
        >
          <input
            type="radio"
            {...register(name as "paymentType")}
            value="CARD"
            defaultChecked
            onChange={() => setSelectedValue("CARD")}
            className="hidden"
          />
          <span className="block font-medium">QR Code Payment</span>
        </label>
        <label
          className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${
            selectedValue === "CASH"
              ? "border-purple-400 bg-purple-500/40 text-white"
              : "border-white/20 bg-white/10 text-white/80"
          }`}
        >
          <input
            type="radio"
            {...register(name as "paymentType")}
            value="CASH"
            onChange={() => setSelectedValue("CASH")}
            className="hidden"
          />
          <span className="block font-medium">Cash on Site</span>
        </label>
      </div>
    );
  }

  // For controlled component usage
  return (
    <div className="grid grid-cols-2 gap-3">
      <label
        className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${
          value === "CARD"
            ? "border-purple-400 bg-purple-500/40 text-white"
            : "border-white/20 bg-white/10 text-white/80"
        }`}
      >
        <input
          type="radio"
          name="payment_preference"
          value="CARD"
          checked={value === "CARD"}
          onChange={() => onChange?.("CARD")}
          className="hidden"
        />
        <span className="block font-medium">QR Code Payment</span>
      </label>
      <label
        className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${
          value === "CASH"
            ? "border-purple-400 bg-purple-500/40 text-white"
            : "border-white/20 bg-white/10 text-white/80"
        }`}
      >
        <input
          type="radio"
          name="payment_preference"
          value="CASH"
          checked={value === "CASH"}
          onChange={() => onChange?.("CASH")}
          className="hidden"
        />
        <span className="block font-medium">Cash on Site</span>
      </label>
    </div>
  );
}
