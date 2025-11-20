import ru from "./messages-ru";
import en from "./messages-en";
import { entityLabel } from "./entity-labels";
import { fieldLabel } from "./field-labels";

type Locale = "ru" | "en";
const locale = (process.env.APP_LOCALE || "ru").toLowerCase() as Locale;
const base = locale === "en" ? en : ru;

// Ключи, где 1-й аргумент = entity
const ENTITY_FIRST_ARG_KEYS = new Set<string>([
  "DATABASE_CREATE_ERROR",
  "DATABASE_UPDATE_ERROR",
  "DATABASE_UPDATE_ERROR_STRING",
  "DATABASE_UPDATE_ERROR_ENTITY",
  "DATABASE_DELETE_ERROR",
  "DATABASE_DELETE_ERROR_STRING",
  "DATABASE_FETCH_ERROR",
  "DATABASE_FETCH_ERROR_BY_ID",
  "DATABASE_FETCH_ERROR_BY_STRING",
  "DATABASE_RESTORE_ERROR",
  "DATABASE_RESTORE_ERROR_STRING",
  "INTERNAL_ERROR",
  "NOT_DELETED_OR_NOT_FOUND",
  "INVALID_RELATION",
  "INVALID_RELATION_LIST",
  "NOT_FOUND",
  "NOT_FOUND_ALMOST_ONE",
  "NOT_FOUND_BY_ID",
  "NOT_FOUND_BY_UUID",
  "NOT_FOUND_BY_ID_STRING",
  "STATUS_ERROR",
  "ISACTIVE",
  "FILIAL_IS_DELETED",
  "ALREADY_DELETED",
  "ALREADY_DELETED_ARRAY",
  "CANNOT_DELETE_HAS_BALANCE",
  "ONLY_FOR_SOURCE",
  "UPDATE_FORBIDDEN",
  "NOT_ALLOWED",
  "PRISMA_ENTITY_NOT_FOUND",
  "BULK_UPSERT_START",
  "BULK_UPSERT_DONE",
  "BULK_UPSERT_FAILED",
  "DATABASE_UPSERT_ERROR",
  "NO_ACCOUNT_POS",
  "NOT_DRAFT",
  "LOCK_ERROR",
  "UNLOCK_ERROR",
  "ALREADY_EXISTS_COMBINATION",
  "MULTIPLE_OPEN_SHIFTS_FOR_STAFF",
]);

// Ключи, где 1-й аргумент = field
const FIELD_FIRST_ARG_KEYS = new Set<string>([
  "REQUIRED_FIELD",
  "INVALID_FORMAT",
  "MUST_BE_STRING",
  "MUST_BE_NUMBER",
  "MUST_BE_BOOLEAN",
  "MUST_BE_ARRAY",
  "MUST_BE_POSITIVE",
  "MUST_BE_MIN",
  "MUST_BE_UNIQUE",
  "ALREADY_USED",
  "MUST_BE_AT_LEAST",
  "INVALID_DATE_FORMAT",
  "ONLY_NUMBERS",
  "INVALID_CODE",
  "INVALID_LENGTH",
  "MUST_BE_INT",
  "MUST_BE_LESS_OR_EQUAL",
]);

const FIELD_SECOND_ARG_KEYS = new Set<string>(["NOT_FOUND_BY_FIELD", "PRISMA_VALIDATION_ERROR", "PRISMA_VALIDATION_ERROR_ID", "UNIQUE_CONSTRAINT_FAILED"]);

function wrapMessages<T extends Record<string, any>>(dict: T): T {
  const out: Record<string, any> = { ...dict };

  for (const key of Object.keys(dict)) {
    const val = dict[key];

    if (typeof val !== "function") continue;

    out[key] = (...args: any[]) => {
      if (ENTITY_FIRST_ARG_KEYS.has(key) && typeof args[0] === "string") {
        args[0] = entityLabel(args[0], locale);
      }

      if (FIELD_FIRST_ARG_KEYS.has(key) && typeof args[0] === "string") {
        args[0] = fieldLabel(args[0], locale);
      }

      if (FIELD_SECOND_ARG_KEYS.has(key)) {
        // второй аргумент — это field
        if (typeof args[1] === "string") {
          args[1] = fieldLabel(args[1], locale);
        }
        // а первый аргумент у этих ключей — entity
        if (typeof args[0] === "string") {
          args[0] = entityLabel(args[0], locale);
        }
      }

      return val(...args);
    };
  }

  return out as T;
}

const messages = wrapMessages(base);
export default messages;
