import { getDefaultBankAccount, getBankAccountById, type BankAccount } from "~/app/constant/bankAccounts";

export function generateQRCodeURL(
  name: string,
  eventDate: string,
  price: number = 150,
  bankAccount?: string
) {
  // Use provided bank account, or fall back to environment variable, or default from config
  const account = bankAccount 
    || process.env.NEXT_PUBLIC_BANK_ACCOUNT 
    || getDefaultBankAccount().accountNumber;
    
  const paymentString = `SPD*1.0*ACC:${account}*RN:VU LOAN TIKOVSKA*AM:${price}*CC:CZK*MSG:GameOn ${name} for event on ${eventDate}`;
  const encodedPaymentString = encodeURIComponent(paymentString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedPaymentString}`;
}

// Helper function to generate QR with specific bank account
export function generateQRCodeURLWithAccount(
  name: string,
  eventDate: string,
  price: number,
  bankAccount: string
) {
  return generateQRCodeURL(name, eventDate, price, bankAccount);
}

// Generate QR code using bank account ID from configuration
export function generateQRCodeURLWithAccountId(
  name: string,
  eventDate: string,
  price: number,
  bankAccountId: string
) {
  const account = getBankAccountById(bankAccountId);
  if (!account) {
    throw new Error(`Bank account with ID '${bankAccountId}' not found`);
  }
  return generateQRCodeURL(name, eventDate, price, account.accountNumber);
}

// Generate QR code with full bank account config (for more control)
export function generateQRCodeURLWithBankAccount(
  name: string,
  eventDate: string,
  price: number,
  bankAccount: BankAccount
) {
  return generateQRCodeURL(name, eventDate, price, bankAccount.accountNumber);
}
