export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

interface IValidator<T> {
  validate(value: unknown): Result<T>;
}

export function validateResults<T>(results: Result<T>[]): void {
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
  | { type: 'alphanumeric' }
  | { type: 'numeric' }
  | { type: 'minValue'; value: number }
  | { type: 'maxValue'; value: number };

export class Validator implements IValidator<string> {
  private rules: StringRule[];

  constructor(rules: StringRule[] = []) {
    this.rules = rules;
  }

  private addRule(rule: StringRule): void {
    this.rules.push(rule);
  }

  equals(value: string): Validator {
    this.addRule({ type: 'equal', value });
    return this;
  }

  notEquals(value: string): Validator {
    this.addRule({ type: 'notEqual', value });
    return this;
  }

  minLength(min: number): Validator {
    this.addRule({ type: 'minLength', min });
    return this;
  }

  maxLength(max: number): Validator {
    this.addRule({ type: 'maxLength', max });
    return this;
  }

  notEmpty(): Validator {
    this.addRule({ type: 'minLength', min: 1 });
    return this;
  }

  alphanumeric(): Validator {
    this.addRule({ type: 'alphanumeric' });
    return this;
  }

  numeric(): Validator {
    this.addRule({ type: 'numeric' });
    return this;
  }

  minValue(value: number): Validator {
    this.addRule({ type: 'minValue', value });
    return this;
  }

  maxValue(value: number): Validator {
    this.addRule({ type: 'maxValue', value });
    return this;
  }

  private checkRule(rule: StringRule, value: string): Result<string> {
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

      case 'numeric':
        return /^[0-9]+$/.test(value)
          ? { ok: true, value }
          : { ok: false, message: 'Value must be numeric.' };

      case 'minValue':
        return parseInt(value) < rule.value
          ? {
              ok: false,
              message: `Value must be greater than or equal to ${rule.value}.`
            }
          : { ok: true, value };

      case 'maxValue':
        return parseInt(value) > rule.value
          ? {
              ok: false,
              message: `Value must be less than or equal to ${rule.value}.`
            }
          : { ok: true, value };

      default:
        return { ok: true, value };
    }
  }

  validate(value: unknown): Result<string> {
    if (value === null) {
      return {
        ok: false,
        message: 'Validator expected a string but received null.'
      };
    } else if (value === undefined) {
      return {
        ok: false,
        message: 'Validator expected a string but received undefined.'
      };
    } else if (typeof value !== 'string') {
      return {
        ok: false,
        message: `Validator expected a string but received ${typeof value}.`
      };
    }

    for (let rule of this.rules) {
      const result = this.checkRule(rule, value);

      if (!result.ok) {
        return result;
      }
    }

    return { ok: true, value };
  }
}
