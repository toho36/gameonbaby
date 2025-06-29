export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  description?: string;
  isDefault?: boolean;
}

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "main",
    name: "Main Account",
    accountNumber: "CZ9130300000001628400020",
    description: "VU LOAN TIKOVSKA - Main event account",
    isDefault: true,
  },
  {
    id: "vitek",
    name: "Vitek Account",
    accountNumber: "CZ5220100000002801494468",
    description: "Vitek's account",
    isDefault: false,
  },
  // Add more bank accounts here as needed
  // {
  //   id: "secondary", 
  //   name: "Secondary Account",
  //   accountNumber: "CZ1234567890123456789012",
  //   description: "Secondary account for special events",
  //   isDefault: false,
  // },
];

export function getBankAccountById(id: string): BankAccount | undefined {
  return BANK_ACCOUNTS.find(account => account.id === id);
}

export function getDefaultBankAccount(): BankAccount {
  const defaultAccount = BANK_ACCOUNTS.find(account => account.isDefault);
  if (defaultAccount) {
    return defaultAccount;
  }
  
  if (BANK_ACCOUNTS.length === 0) {
    throw new Error("No bank accounts configured");
  }
  
  return BANK_ACCOUNTS[0]!; // Non-null assertion since we checked length above
}

export function getAllBankAccounts(): BankAccount[] {
  return BANK_ACCOUNTS;
} 