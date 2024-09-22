import QRCode from 'qrcode';
import {format} from "date-fns";


enum QrParamType {
  ACCOUNT = "ACC",
  AMOUNT = "AM",
  CURRENCY = "CC",
  MESSAGE = "MSG",
  VARIABLE_SYMBOL = "X-VS"
}

export interface CreatePaymentCommand {
  firstName: string;
  lastName: string;
  price: number;
}

export async function createPayment(command: CreatePaymentCommand): Promise<string> {
  const currentDate = new Date()
  const variableSymbolFormat = 'yyMMdd'
  const messageFormat = 'dd. MM. yy'

  const variableSymbol = generateVariableSymbol(format(currentDate, variableSymbolFormat))
  const formattedAmount = command.price.toFixed(2);
  const text = "SPD*1.0" +
    `*${QrParamType.ACCOUNT}:${process.env.BANK_ACCOUNT}` +
    `*${QrParamType.AMOUNT}:${formattedAmount}` +
    `*${QrParamType.CURRENCY}:CZK` +
    `*${QrParamType.MESSAGE}:Game On Baby! (${format(currentDate, messageFormat)}) - ${command.firstName} ${command.lastName}` +
    `*${QrParamType.VARIABLE_SYMBOL}:${variableSymbol}`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return await QRCode.toDataURL(text)
}

function generateVariableSymbol(prefix: string): string {
  const randomizedNumber = Math.floor(Math.random() * 10000).toString();
  return `${prefix}${randomizedNumber.padStart(4, '0')}`;
}

