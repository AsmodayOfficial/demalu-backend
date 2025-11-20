// src/common/validators/number-optional.transform.ts
import { TransformFnParams } from "class-transformer";

export const toOptionalNumber = ({ value }: TransformFnParams) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
};
