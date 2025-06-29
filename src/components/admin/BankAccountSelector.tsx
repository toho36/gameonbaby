"use client";

import React from "react";
import { getAllBankAccounts, getDefaultBankAccount, type BankAccount } from "~/app/constant/bankAccounts";

interface BankAccountSelectorProps {
  selectedAccountId?: string;
  onAccountChange: (accountId: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function BankAccountSelector({
  selectedAccountId,
  onAccountChange,
  disabled = false,
  className = "",
}: BankAccountSelectorProps) {
  const bankAccounts = getAllBankAccounts();
  const defaultAccount = getDefaultBankAccount();
  const currentSelection = selectedAccountId || "";

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700">
        Bank Account for Payments
      </label>
      <select
        id="bankAccount"
        value={currentSelection}
        onChange={(e) => onAccountChange(e.target.value)}
        disabled={disabled}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
      >
        <option value="">Use Default Account ({defaultAccount.name})</option>
        {bankAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} - {account.accountNumber}
            {account.isDefault && " (System Default)"}
          </option>
        ))}
      </select>
      
      {/* Show account details */}
      <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
        {(() => {
          const selectedAccount = currentSelection 
            ? bankAccounts.find(acc => acc.id === currentSelection)
            : defaultAccount;
          
          return selectedAccount ? (
            <div>
              <p className="font-medium text-gray-900">
                {selectedAccount.name}
                {!currentSelection && " (Default)"}
              </p>
              <p className="text-gray-600">Account: {selectedAccount.accountNumber}</p>
              {selectedAccount.description && (
                <p className="text-gray-500">{selectedAccount.description}</p>
              )}
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

// Component to display bank account info (read-only)
export function BankAccountInfo({ 
  accountId, 
  className = "" 
}: { 
  accountId?: string; 
  className?: string; 
}) {
  const bankAccounts = getAllBankAccounts();
  const defaultAccount = getDefaultBankAccount();
  const account = accountId 
    ? bankAccounts.find(acc => acc.id === accountId)
    : defaultAccount;

  if (!account) {
    return <div className={className}>Unknown bank account</div>;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-900">{account.name}</span>
      </div>
      <p className="text-xs text-gray-500">{account.accountNumber}</p>
    </div>
  );
} 