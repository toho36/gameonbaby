"use client";

import React, { useState, useEffect } from "react";
import { RegistrationFormValues } from "~/features/registration/types";
import {
  UseFormRegister,
  useFormContext,
  UseFormSetValue,
} from "react-hook-form";
import { PaymentType } from "~/app/constant/paymentType";

interface PaymentMethodSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  register?: UseFormRegister<RegistrationFormValues>;
  name?: string;
  setValue?: UseFormSetValue<RegistrationFormValues>;
}

export default function PaymentMethodSelector({
  value = "CARD",
  onChange,
  register,
  name = "paymentType",
  setValue,
}: PaymentMethodSelectorProps) {
  // For react-hook-form
  const [selectedValue, setSelectedValue] = useState("CARD");
  const formContext = useFormContext();

  // Update selected value when using controlled component
  useEffect(() => {
    if (value) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleCashClick = () => {
    setSelectedValue("CASH");

    // Ensure form value is updated properly
    if (formContext) {
      formContext.setValue("paymentType", "CASH");
    } else if (setValue) {
      setValue("paymentType", "CASH");
    }
  };

  const handleCardClick = () => {
    setSelectedValue("CARD");

    // Ensure form value is updated properly
    if (formContext) {
      formContext.setValue("paymentType", "CARD");
    } else if (setValue) {
      setValue("paymentType", "CARD");
    }
  };

  if (register) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label
          className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${
            selectedValue === "CARD"
              ? "border-purple-400 bg-purple-500/40 text-white"
              : "border-white/20 bg-white/10 text-white/80"
          }`}
          onClick={handleCardClick}
        >
          <input
            type="radio"
            {...register(name as "paymentType")}
            value="CARD"
            checked={selectedValue === "CARD"}
            onChange={handleCardClick}
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
          onClick={handleCashClick}
        >
          <input
            type="radio"
            {...register(name as "paymentType")}
            value="CASH"
            checked={selectedValue === "CASH"}
            onChange={handleCashClick}
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
        onClick={() => onChange?.("CARD")}
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
        onClick={() => onChange?.("CASH")}
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
