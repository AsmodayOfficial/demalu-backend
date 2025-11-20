// src/configs/messages-ru.ts

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default {
  // --- DB / Internal ---
  DATABASE_CREATE_ERROR: (entity: string) => `Ошибка базы данных при создании ${entity}.`,
  DATABASE_UPDATE_ERROR: (entity: string, id: number | string) => `Ошибка базы данных при обновлении ${entity} с ID ${id}.`,
  DATABASE_UPDATE_ERROR_STRING: (entity: string, field: string) => `Ошибка базы данных при обновлении ${entity} по полю ${field}.`,
  DATABASE_UPDATE_ERROR_ENTITY: (entity: string) => `Ошибка базы данных при обновлении ${entity}.`,
  DATABASE_DELETE_ERROR: (entity: string, ids: number | number[] | string | string[]) =>
    Array.isArray(ids) ? `Ошибка базы данных при удалении ${entity} с ID [${ids.join(", ")}].` : `Ошибка базы данных при удалении ${entity} с ID ${ids}.`,
  DATABASE_DELETE_ERROR_STRING: (entity: string, ids: string | string[]) =>
    Array.isArray(ids) ? `Ошибка базы данных при удалении ${entity} с ID [${ids.join(", ")}].` : `Ошибка базы данных при удалении ${entity} с ID ${ids}.`,
  DATABASE_FETCH_ERROR: (entity: string) => `Ошибка базы данных при получении ${entity}.`,
  DATABASE_FETCH_ERROR_BY_ID: (entity: string, id: number | string) => `Ошибка базы данных при получении ${entity} с ID ${id}.`,
  DATABASE_FETCH_ERROR_BY_STRING: (entity: string, id: string) => `Ошибка базы данных при получении ${entity} с ID ${id}.`,
  DATABASE_RESTORE_ERROR: (entity: string, id: number) => `Не удалось восстановить ${entity} с ID ${id}. Произошла непредвиденная ошибка.`,
  DATABASE_RESTORE_ERROR_STRING: (entity: string, id: string) => `Ошибка базы данных при восстановлении ${entity} с ID ${id}.`,
  INTERNAL_ERROR: (entity: string) => `${entity}: внутренняя ошибка. Повторите попытку позже.`,
  DATABASE_DELETE_ERROR_ARRAY: (entity: string, ids: (string | number)[]) => `Ошибка базы данных при удалении ${entity} с ID [${ids.join(", ")}].`,
  DATABASE_UPSERT_ERROR: (entity: string) => `Ошибка базы данных при upsert ${entity}.`,

  // --- Not found / relations ---
  NOT_DELETED_OR_NOT_FOUND: (entity: string, id: number | string) => `${entity} с ID ${id} не найден или не помечен как удалённый.`,
  INVALID_RELATION: (entity: string, id?: number | string) => {
    const displayId = typeof id === "number" || typeof id === "string" ? id : "UNKNOWN";
    return `${entity} с ID ${displayId} не существует или недопустим.`;
  },
  INVALID_RELATION_LIST: (entity: string, ids: number[] | string) => {
    const list = Array.isArray(ids) ? ids.join(", ") : String(ids);
    return `${entity} с ID(ами) ${list} не существуют или недопустимы.`;
  },
  ONLY_ONE_RELATION_ALLOWED: "Можно указать только одно из полей: 'objectId' или 'projectId' (нельзя оба сразу).",
  EXACTLY_ONE_RELATION_ALLOWED: "Должно быть указано ровно одно из полей: objectId или projectId.",
  NOT_FOUND: (entity: string) => `${entity} не найден.`,
  NOT_FOUND_ALMOST_ONE: (entity: string) => `Требуется хотя бы один ${entity}.`,
  NOT_FOUND_BY_ID: (entity: string, ids: number | number[]) => (Array.isArray(ids) ? `${entity} с ID [${ids.join(", ")}] не найдены.` : `${entity} с ID ${ids} не найден.`),
  NOT_FOUND_BY_UUID: (entity: string, ids: string | string[]) => (Array.isArray(ids) ? `${entity} с ID [${ids.join(", ")}] не найдены.` : `${entity} с ID ${ids} не найден.`),
  NOT_FOUND_BY_ID_STRING: (entity: string, ids: string | string[]) => (Array.isArray(ids) ? `${entity} с ID [${ids.join(", ")}] не найдены.` : `${entity} с ID ${ids} не найден.`),
  NOT_FOUND_BY_FIELD: (entity: string, field: string) => `${entity} с полем ${field} не найден.`,
  INVALID_ID: (id: any) => `Недопустимый формат ID: ${id}`,

  // --- Common validation ---
  REQUIRED_FIELD: (field: string) => `${field} — обязательное поле.`,
  INVALID_FORMAT: (field: string) => `Недопустимый формат поля ${field}.`,
  MUST_BE_STRING: (field: string) => `${field} должно быть строкой.`,
  MUST_BE_NUMBER: (field: string) => `${field} должно быть числом.`,
  MUST_BE_BOOLEAN: (field: string) => `${field} должно быть true или false.`,
  MUST_BE_ARRAY: (field: string) => `${field} должно быть массивом.`,
  INVALID_URL: `Недопустимый формат URL.`,
  STATUS_ERROR: `Статус должен быть либо ACTIVE, либо INACTIVE.`,
  MUST_BE_POSITIVE: (field: string) => `${field} должно быть положительным целым.`,
  MUST_BE_MIN: (field: string, min: number) => `${field} должно быть не меньше ${min}`,
  MUST_BE_UNIQUE: (field: string) => `${field} должно быть уникальным.`,
  ALREADY_USED: (field: string) => `${capitalize(field.trim())} уже используется в базе.`,
  MUST_BE_AT_LEAST: (field: string, min: number) => `${field} должно быть не меньше ${min}.`,
  ONLY_NUMBERS: (entity: string) => `${entity} должно содержать только цифры.`,
  INVALID_CODE: `Код должен содержать заглавные буквы, цифры или символы -/_`,
  INVALID_LENGTH: (field: string, min: number, max: number) => `${field} должно быть длиной от ${min} до ${max} символов.`,
  MUST_BE_INT: (field: string) => `${field} должно быть целым числом.`,
  NOT_EMPTY: (field: string) => `${field} не может быть пустым.`,
  REQUIRED_EXACTLY_ONE_OF: (fields: string[]) => `Должно быть указано ровно одно из полей: ${fields.join(", ")}`,
  MUST_BE_VALID_ENUM: (field: string, allowed: string[]) => `${field} должно быть одним из: ${allowed.join(", ")}`,
  MUST_BE_LESS_OR_EQUAL: (field: string, max: number) => `${field} должно быть меньше либо равно ${max}`,

  // --- Dates / periods ---
  INVALID_DATE_FORMAT: (field: string) => `${field} должно быть датой в формате YYYY-MM-DD.`,
  PERIOD_OVERLAP: (entity: string) => `Период для ${entity} пересекается с существующим.`,
  INVALID_DATE_RANGE: `Дата начала должна быть раньше даты окончания.`,
  ENDDATE_WITH_START: "Нельзя передавать дату окончания без даты начала.",
  FUTURE_DATE: (field: string) => `${field} должно быть в будущем.`,

  // --- Upload / files ---
  FILE_EMPTY: "Загруженный файл пуст.",
  NO_FILE: "Файл не загружен.",
  MINIO_UPLOAD_ERROR: (entity: string) => `Ошибка MinIO при загрузке файла для ${entity}.`,
  UNSUPPORTED_FILE_TYPE: (entity: string) => `Неподдерживаемый тип файла (${entity}).`,
  SUPPORTED_FILE_TYPE: (allowed: string[]) => `Разрешены только следующие форматы: ${allowed.join(", ")}`,

  // --- Stock / domain specific ---
  NOT_ENOUGH_STOCK: `Недостаточно остатка для уменьшения.`,
  ADJUSTMENT_TYPE_ERROR: `Тип корректировки должен быть 'INCREASE' или 'DECREASE'.`,
  ISACTIVE: (entity: string, id: number) => `${entity} с ID ${id} уже активен.`,
  FILIAL_IS_DELETED: (entity: string, id: number) => `${entity} с ID ${id} уже удалён.`,
  ALREADY_DELETED: (entity: string, id: number) => `${entity} с ID ${id} уже удалён.`,
  ALREADY_DELETED_ARRAY: (entity: string, ids: (string | number)[]) => `${entity} с ID [${ids.join(", ")}] уже удалены.`,
  DELETED_ARRAY: <T extends string | number>(entity: string, ids: T[]) => `${entity} с ID [${ids.join(", ")}] успешно удалены.`,
  CANNOT_DELETE_HAS_BALANCE: (entity: string, id: number) => `${entity} с ID ${id} нельзя удалить — есть остатки на складах.`,
  PRODUCT_NOT_IN_WAREHOUSE: (productId: number, warehouseId: number) => `Товар ${productId} не принадлежит складу ${warehouseId}.`,
  INSUFFICIENT_PRODUCT_QUANTITY: (available: number | string, requested: number | string) => `Недостаточное количество: доступно ${available} на складе, а запрошено ${requested}.`,
  INVALID_REVERSE_TRANSFER: "Нельзя безопасно откатить перемещение. Неконсистентное состояние товаров.",

  // --- Auth / security ---
  UNAUTHORIZED_ACCESS: "Доступ запрещён. Пользователь не авторизован.",
  FORBIDDEN_ACTION: "Нет прав для выполнения действия.",

  // --- Misc ---
  NO_VALID_KEYS_TO_UPDATE: "Не переданы валидные поля для обновления.",
  ACTIVATION_CODE: "Неверный код активации",
  INCORRECT_CAPTCHA: "Неверная капча",
  FAVORITE_RESTORE_TOO_SOON: "Восстановить избранное можно только через 1 минуту после удаления",
  STAFF_STATUS: "Ваш аккаунт неактивен!",
  INVALID_KEY: (entity: string, key: string) => `${entity} с ключом ${key} не существует или недопустим.`,
  INVALID_MODEl: (entity: string) => `Модель ${entity} недействительна или не найдена в PrismaClient`,
  NOT_ENOUGH_DATA: (entity: string) => `Недостаточно данных или неверный формат для ${entity}.`,
  IMPORT_ROW_ERROR: (row: number, field: string, error: string) => `Ошибка в строке ${row}, поле "${field}": ${error}`,
  ONLY_FOR_SOURCE: (entity: string, source: string) => `Статус можно менять только для ${entity} с source=${source}.`,
  PASSWORD_UPDATED: "Пароль обновлён.",
  RESET_CODE_SENT: "Код для сброса отправлен.",
  INVALID_OR_EXPIRED_CODE: "Неверный или просроченный код.",
  SETTING_DELETE_SUCCESS: (key: string) => `Настройка с ключом "${key}" успешно удалена`,
  RELATED_ENTITY_NOT_FOUND: (related: string, base: string, id: number) => `${related} не найден(а) для ${base.toLowerCase()} #${id}.`,
  LOCK_ERROR: (entity: string, id: number | string) => `Ошибка блокировки ${entity} с ID ${id}.`,
  UNLOCK_ERROR: (entity: string, id: number | string) => `Ошибка разблокировки ${entity} с ID ${id}.`,
  ALREADY_EXISTS_COMBINATION: (entity: string) => `Запись с такой комбинацией уже существует в ${entity}.`,
  MULTIPLE_OPEN_SHIFTS_FOR_STAFF: (entity: string, staffId: number, posId: number) =>
    `Найдено несколько открытых смен для ${entity} (staff ID=${staffId}) на POS=${posId}. Разрешена только одна открытая смена.`,
  INSUFFICIENT_NON_DEBT_PAYMENT: (debt: number, total: number) => `Нельзя распределить ${debt} как долг — доступные недолговые платежи: ${total}`,
  UPDATE_FORBIDDEN: (entity: string) => `${entity} нельзя изменять.`,
  NOT_ALLOWED: (entity: string) => `${entity} не разрешён.`,
  UNKNOWN_ERROR: () => `Неизвестная ошибка. Повторите попытку позже.`,
  NOT_BELONG: (field: string, entity: string) => `Некоторые ${field} не принадлежат этому ${entity}.`,
  SAME_LENGHT: (entity: string, entity2: string) => `${entity} и ${entity2} должны быть одинаковой длины`,

  // --- Prisma helper texts ---
  PRISMA_VALIDATION_ERROR: (entity: string, field: string, value: string, error: string) => `Ошибка проверки уникальности '${entity}.${field}' со значением '${value}': ${error}`,
  PRISMA_VALIDATION_ERROR_ID: (entity: string, field: string, value: number, error: string) =>
    `Ошибка проверки уникальности '${entity}.${field}' со значением '${value}': ${error}`,
  UNIQUE_CONSTRAINT_FAILED: (entity: string, field: string, value: string) => `Значение '${value}' поля '${field}' в ${entity} уже существует.`,
  PRISMA_ENTITY_NOT_FOUND: (entity: string) => `Сущность '${entity}' не найдена в PrismaClient. Проверьте корректность имени модели.`,

  // --- Bulk upsert / arrays / etc. ---
  BULK_UPSERT_START: (entity: string, count: number) => `Массовый upsert ${entity}: количество=${count}`,
  BULK_UPSERT_DONE: (entity: string, affected: number) => `Массовый upsert ${entity} завершён: затронуто=${affected}`,
  BULK_UPSERT_FAILED: (entity: string) => `Сбой массового upsert ${entity}`,

  // --- POS / statuses ---
  NO_ACCOUNT_POS: (id: number) => `У POS с ID ${id} не привязан счет.`,
  NOT_DRAFT: (entity: string) => `${entity} не в статусе draft.`,

  // --- StockMove rules ---
  STOCKMOVE_INCOME_TARGETS_FORBIDDEN: "Для INCOME все цели (targetObjectId, targetProjectId, targetEmployeeId, targetWarehouseId) должны быть пустыми.",
  STOCKMOVE_EXPENSE_TARGET_WAREHOUSE_FORBIDDEN: "Для EXPENSE поле targetWarehouseId запрещено.",
  STOCKMOVE_EXPENSE_AT_MOST_ONE_HUMAN_TARGET: "Для EXPENSE можно указать не более одной цели из targetObjectId/targetProjectId/targetEmployeeId.",
  STOCKMOVE_MOVEMENT_TARGET_REQUIRED: "Для MOVEMENT необходимо указать targetWarehouseId.",
  STOCKMOVE_MOVEMENT_TARGET_DIFFERS: "Для MOVEMENT targetWarehouseId должен отличаться от warehouseId.",
  STOCKMOVE_MOVEMENT_HUMAN_TARGETS_FORBIDDEN: "Для MOVEMENT поля targetObjectId/targetProjectId/targetEmployeeId должны быть пустыми.",
  STOCKMOVE_MOVEMENT_COUNTERPARTY_FORBIDDEN: "Для MOVEMENT поле counterpartyId должно быть пустым.",
  STOCKMOVE_WRITEOFF_TARGETS_FORBIDDEN: "Для WRITEOFF все целевые поля должны быть пустыми.",
  STOCKMOVE_WRITEOFF_COUNTERPARTY_FORBIDDEN: "Для WRITEOFF поле counterpartyId должно быть пустым.",

  // --- Combinations / unique keys ---
  INVALID_COMBINATIONS: (fields: string[]) => `Комбинация полей: ${fields.join(", ")} уже используется в базе данных.`,
  MUST_BE_MATCH: (entity: string) => `${entity} не совпадают`,

  // --- Auth specific ---
  INVALID_CREDENTIALS: () => "Неверный логин или пароль.",
  AUTHENTICATION_FAILED: () => "Ошибка авторизации.",
  USER_INACTIVE: () => "Ваш аккаунт неактивен!",
  USER_DELETED: () => "Пользователь удалён.",
  INVALID_REFRESH_TOKEN: () => "Некорректный (или просроченный) refresh токен.",
  MALFORMED_REFRESH_TOKEN: () => "Некорректная структура refresh токена.",
  USER_NOT_FOUND: () => "Пользователь не найден.",
  LOGIN_AND_PASSWORD_REQUIRED: () => "Требуются логин и пароль.",
};
