import QRCode from "qrcode";
import { format } from "date-fns";
import { getDefaultBankAccount, getBankAccountById, type BankAccount } from "~/app/constant/bankAccounts";

enum QrParamType {
  ACCOUNT = "ACC",
  AMOUNT = "AM",
  CURRENCY = "CC",
  MESSAGE = "MSG",
  VARIABLE_SYMBOL = "X-VS",
}

export interface CreatePaymentCommand {
  firstName: string;
  // lastName: string;
  price: number;
  bankAccountId?: string; // Optional bank account ID to use specific account
}

export async function createPayment(
  command: CreatePaymentCommand,
): Promise<string> {
  const currentDate = new Date();
  const variableSymbolFormat = "yyMMdd";
  const messageFormat = "dd. MM. yy";

  const variableSymbol = generateVariableSymbol(
    format(currentDate, variableSymbolFormat),
  );
  const formattedAmount = command.price.toFixed(2);
  
  // Get bank account - use specified ID, environment variable, or default
  let bankAccount: string;
  if (command.bankAccountId) {
    const account = getBankAccountById(command.bankAccountId);
    if (!account) {
      throw new Error(`Bank account with ID '${command.bankAccountId}' not found`);
    }
    bankAccount = account.accountNumber;
  } else {
    bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT || getDefaultBankAccount().accountNumber;
  }
  
  const text =
    "SPD*1.0" +
    `*${QrParamType.ACCOUNT}:${bankAccount}` +
    `*${QrParamType.AMOUNT}:${formattedAmount}` +
    `*${QrParamType.CURRENCY}:CZK` +
    `*${QrParamType.MESSAGE}:Game On Baby! (${format(currentDate, messageFormat)}) - ${command.firstName} ` +
    `*${QrParamType.VARIABLE_SYMBOL}:${variableSymbol}`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return await QRCode.toDataURL(text);
}

// Helper function to create payment with specific bank account
export async function createPaymentWithAccount(
  command: Omit<CreatePaymentCommand, 'bankAccountId'>,
  bankAccount: BankAccount
): Promise<string> {
  return createPayment({ ...command, bankAccountId: bankAccount.id });
}

function generateVariableSymbol(prefix: string): string {
  const randomizedNumber = Math.floor(Math.random() * 10000).toString();
  return `${prefix}${randomizedNumber.padStart(4, "0")}`;
}
