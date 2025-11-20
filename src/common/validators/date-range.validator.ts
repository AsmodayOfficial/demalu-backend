// src/common/validators/project-date-range.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import messages from "src/configs/messages";

type WithDates = {
  startDate?: Date | null;
  endDate?: Date | null;
};

@ValidatorConstraint({ name: "ProjectDateRange", async: false })
export class DateRangeConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = (args.object || {}) as WithDates;

    const start = toValidDateOrUndefined(obj.startDate);
    const end = toValidDateOrUndefined(obj.endDate);

    if (end && !start) return false;

    if (!start && !end) return true;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (start && !(start.getTime() >= startOfToday.getTime())) return false;
    if (end && !(end.getTime() >= startOfToday.getTime())) return false;

    // Allow same-day start/end (<= instead of <).
    if (start && end && !(start.getTime() <= end.getTime())) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const obj = (args.object || {}) as WithDates;
    const start = toValidDateOrUndefined(obj.startDate);
    const end = toValidDateOrUndefined(obj.endDate);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (end && !start) {
      return messages.ENDDATE_WITH_START;
    }
    if (!start && !end) {
      return "Date validation failed.";
    }
    if (start && !(start.getTime() >= startOfToday.getTime())) {
      return messages.FUTURE_DATE("Start Date");
    }
    if (end && !(end.getTime() >= startOfToday.getTime())) {
      return messages.FUTURE_DATE("End Date");
    }
    if (start && end && !(start.getTime() <= end.getTime())) {
      return messages.INVALID_DATE_RANGE;
    }
    return "Invalid project date range.";
  }
}

function toValidDateOrUndefined(v: unknown): Date | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const d = v instanceof Date ? v : new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
}
