type Locale = "ru" | "en";

const FIELDS: Record<Locale, Record<string, string>> = {
  en: {
    Name: "Name",
    Surname: "Surname",
    Email: "Email",
    Phone: "Phone",
    Password: "Password",
    "Role Id": "Role Id",
    "Company Id": "Company Id",
    "Object Id": "Object Id",
    isActive: "Is Active",
    Code: "Code",
    Description: "Description",
  },
  ru: {
    Name: "Название",
    Surname: "Фамилия",
    Email: "Email",
    Phone: "Телефон",
    Password: "Пароль",
    "Role Id": "Роль",
    "Company Id": "Компания",
    "Object Id": "Объект",
    isActive: "Активен",
    Code: "Код",
    Description: "Описание",
  },
};

export function fieldLabel(field: string, locale: Locale = "ru"): string {
  const dict = FIELDS[locale] ?? FIELDS.ru;
  return dict[field] ?? field;
}
