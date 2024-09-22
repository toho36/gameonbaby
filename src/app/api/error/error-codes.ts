import {Simulate} from "react-dom/test-utils";

export enum ErrorCodes {
  NOT_FOUND,
  BAD_PAYMENT_TYPE,
  EVENT_NOT_FOUND,
  REGISTRATION_ALREADY_EXISTS,
}

export enum Modules {
  EVENT = 1,
  REGISTRATION,
}

export default function getCode(module: Modules, errorCode: ErrorCodes) {
  return `${module}00${errorCode}`
}
