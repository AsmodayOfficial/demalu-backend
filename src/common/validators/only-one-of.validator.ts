// src/common/validators/only-one-of.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export function OnlyOneOf<K extends string>(...keys: K[]) {
  return function (object: any, propertyName: string) {
    const validationOptions: ValidationOptions = {
      message: `Only one of ${keys.map(k => `'${k}'`).join(" or ")} may be set. They cannot both be present.`,
    };
    registerDecorator({
      name: "OnlyOneOf",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const value = args.object as Record<string, unknown>;
          const present = keys.filter(k => value[k] !== undefined && value[k] !== null);
          return present.length <= 1;
        },
      },
    });
  };
}
