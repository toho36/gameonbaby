"use client";

import React, { useState, useEffect } from "react";
import { RegistrationFormValues } from "~/features/registration/types";
import { UseFormRegister } from "react-hook-form";

interface PaymentMethodSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  register?: UseFormRegister<RegistrationFormValues>;
  name?: string;
}

export default function PaymentMethodSelector({
  value = "QR",
  onChange,
  register,
  name = "paymentType",
}: PaymentMethodSelectorProps) {
  // For react-hook-form
  const [selectedValue, setSelectedValue] = useState("QR");

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
            selectedValue === "QR"
              ? "border-purple-400 bg-purple-500/40 text-white"
              : "border-white/20 bg-white/10 text-white/80"
          }`}
        >
          <input
            type="radio"
            {...register(name as "paymentType")}
            value="QR"
            defaultChecked
            onChange={() => setSelectedValue("QR")}
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
          value === "QR"
            ? "border-purple-400 bg-purple-500/40 text-white"
            : "border-white/20 bg-white/10 text-white/80"
        }`}
      >
        <input
          type="radio"
          name="payment_preference"
          value="QR"
          checked={value === "QR"}
          onChange={() => onChange?.("QR")}
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
