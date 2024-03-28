export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

interface IValidator<T> {
  validate(value: unknown): Result<T>;
}
export function validateResults(
  results: (Result<string> | Result<number>)[]
): void {
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (!result.ok) {
      errors.push(`Result at index ${index}: ${result.message}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Validation Error: ${errors.join('\n')}`);
  }
}

type StringRule =
  | { type: 'equal'; value: string }
  | { type: 'notEqual'; value: string }
  | { type: 'minLength'; min: number }
  | { type: 'maxLength'; max: number }
  | { type: 'alphanumeric' };

type NumericRule =
  | { type: 'minValue'; value: number }
  | { type: 'maxValue'; value: number }
  | { type: 'integer' };

export class StringValidator implements IValidator<string> {
  private rules: StringRule[];

  constructor(rules: StringRule[] = []) {
    this.rules = rules;
  }

  private addRule(rule: StringRule): void {
    this.rules.push(rule);
  }

  equals(value: string): StringValidator {
    this.addRule({ type: 'equal', value });
    return this;
  }

  notEquals(value: string): StringValidator {
    this.addRule({ type: 'notEqual', value });
    return this;
  }

  minLength(min: number): StringValidator {
    this.addRule({ type: 'minLength', min });
    return this;
  }

  maxLength(max: number): StringValidator {
    this.addRule({ type: 'maxLength', max });
    return this;
  }

  alphanumeric(): StringValidator {
    this.addRule({ type: 'alphanumeric' });
    return this;
  }

  notEmpty(): StringValidator {
    this.addRule({ type: 'minLength', min: 1 });
    return this;
  }

  validate(value: unknown): Result<string> {
    if (typeof value !== 'string') {
      return {
        ok: false,
        message: `Validator expected a string but received ${typeof value}.`
      };
    }

    let result: Result<string> = { ok: true, value };

    for (const rule of this.rules) {
      result = this.checkStringRule(rule, value);
      if (!result.ok) {
        break;
      }
    }

    return result;
  }

  private checkStringRule(rule: StringRule, value: string): Result<string> {
    switch (rule.type) {
      case 'equal':
        return rule.value !== value
          ? {
              ok: false,
              message: `Value was expected to be '${rule.value}' but was '${value}'.`
            }
          : { ok: true, value };

      case 'notEqual':
        return rule.value === value
          ? { ok: false, message: `Value must not be '${rule.value}'.` }
          : { ok: true, value };

      case 'minLength':
        return value.length < rule.min
          ? {
              ok: false,
              message: `String length must be greater than or equal to ${rule.min} but was ${value.length}.`
            }
          : { ok: true, value };

      case 'maxLength':
        return value.length > rule.max
          ? {
              ok: false,
              message: `String length must be less than or equal to ${rule.max} but was ${value.length}.`
            }
          : { ok: true, value };

      case 'alphanumeric':
        return /^[a-zA-Z0-9]+$/.test(value)
          ? { ok: true, value }
          : {
              ok: false,
              message: 'Value must contain only alphanumeric characters.'
            };

      default:
        return { ok: true, value };
    }
  }
}

export class NumericValidator implements IValidator<number> {
  private rules: NumericRule[];

  constructor(rules: NumericRule[] = []) {
    this.rules = rules;
  }

  private addRule(rule: NumericRule): void {
    this.rules.push(rule);
  }

  minValue(value: number): NumericValidator {
    this.addRule({ type: 'minValue', value });
    return this;
  }

  maxValue(value: number): NumericValidator {
    this.addRule({ type: 'maxValue', value });
    return this;
  }

  integer(): NumericValidator {
    this.addRule({ type: 'integer' });
    return this;
  }

  validate(value: unknown): Result<number> {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        ok: false,
        message: `Validator expected a number but received ${typeof value}.`
      };
    }

    let result: Result<number> = { ok: true, value };

    for (const rule of this.rules) {
      result = this.checkNumericRule(rule, value);
      if (!result.ok) {
        break;
      }
    }

    return result;
  }

  private checkNumericRule(rule: NumericRule, value: number): Result<number> {
    switch (rule.type) {
      case 'minValue':
        return value < rule.value
          ? {
              ok: false,
              message: `Value must be greater than or equal to ${rule.value}.`
            }
          : { ok: true, value };

      case 'maxValue':
        return value > rule.value
          ? {
              ok: false,
              message: `Value must be less than or equal to ${rule.value}.`
            }
          : { ok: true, value };
      case 'integer':
        return value % 1 !== 0
          ? { ok: false, message: 'Value must be an integer.' }
          : { ok: true, value };
      default:
        return { ok: true, value };
    }
  }
}
