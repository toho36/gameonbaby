import React from "react";
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
  if (register) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <label className="flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/10 p-3 transition-all hover:border-white/40 hover:bg-white/20">
          <input
            type="radio"
            {...register(name as "paymentType")}
            value="CARD"
            defaultChecked
            className="h-4 w-4 border-white/40 text-white focus:ring-white/20"
          />
          <div className="ml-3">
            <span className="block font-medium">QR Code Payment</span>
            <span className="text-xs text-white/70">Pay via bank transfer</span>
          </div>
        </label>
        <label className="flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/10 p-3 transition-all hover:border-white/40 hover:bg-white/20">
          <input
            type="radio"
            {...register(name as "paymentType")}
            value="CASH"
            className="h-4 w-4 border-white/40 text-white focus:ring-white/20"
          />
          <div className="ml-3">
            <span className="block font-medium">Cash on Site</span>
            <span className="text-xs text-white/70">Pay when you arrive</span>
          </div>
        </label>
      </div>
    );
  }

  // For controlled component usage
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/10 p-4 transition-all hover:border-white/40 hover:bg-white/20">
        <input
          type="radio"
          name="payment_preference"
          value="CARD"
          checked={value === "CARD"}
          onChange={() => onChange?.("CARD")}
          className="h-5 w-5 border-white/40 text-white focus:ring-white/20"
        />
        <div className="ml-3">
          <span className="block font-medium">QR Code Payment</span>
          <span className="text-xs text-white/70">Pay via bank transfer</span>
        </div>
      </label>
      <label className="flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/10 p-4 transition-all hover:border-white/40 hover:bg-white/20">
        <input
          type="radio"
          name="payment_preference"
          value="CASH"
          checked={value === "CASH"}
          onChange={() => onChange?.("CASH")}
          className="h-5 w-5 border-white/40 text-white focus:ring-white/20"
        />
        <div className="ml-3">
          <span className="block font-medium">Cash on Site</span>
          <span className="text-xs text-white/70">Pay when you arrive</span>
        </div>
      </label>
    </div>
  );
}
