import {
  NumericValidator,
  StringValidator,
  validateResults
} from '../src/common/validator';

describe('test validator', () => {
  test('#test validator', () => {
    let value = new StringValidator().notEmpty().validate('');
    expect(value.ok).toBe(false);

    value = new StringValidator().notEmpty().validate('test');
    expect(value.ok).toBe(true);

    value = new StringValidator().alphanumeric().validate('tes333t');
    expect(value.ok).toBe(true);

    value = new StringValidator().alphanumeric().validate('tes333t@');
    expect(value.ok).toBe(false);

    let numberValue = new NumericValidator().validate(333);
    expect(numberValue.ok).toBe(true);

    numberValue = new NumericValidator().minValue(10).validate(9);
    expect(numberValue.ok).toBe(false);

    numberValue = new NumericValidator().minValue(10).validate('11');
    expect(numberValue.ok).toBe(false);

    numberValue = new NumericValidator().minValue(10).validate(11);
    expect(numberValue.ok).toBe(true);

    numberValue = new NumericValidator().maxValue(10).validate('11');
    expect(numberValue.ok).toBe(false);

    numberValue = new NumericValidator().maxValue(10).validate(11);
    expect(numberValue.ok).toBe(false);

    numberValue = new NumericValidator().maxValue(10).validate('9');
    expect(numberValue.ok).toBe(false);

    numberValue = new NumericValidator().maxValue(10).validate(9);
    expect(numberValue.ok).toBe(true);

    numberValue = new NumericValidator().integer().validate(9.5);
    expect(numberValue.ok).toBe(false);

    numberValue = new NumericValidator().integer().validate(900);
    expect(numberValue.ok).toBe(true);

    value = new StringValidator().maxLength(10).validate('123456789011');
    expect(value.ok).toBe(false);

    value = new StringValidator().maxLength(10).validate('123456789');
    expect(value.ok).toBe(true);

    value = new StringValidator().minLength(10).validate('123456789');
    expect(value.ok).toBe(false);

    value = new StringValidator().minLength(10).validate('123456789011');
    expect(value.ok).toBe(true);

    value = new StringValidator().equals('test').validate('test');
    expect(value.ok).toBe(true);

    value = new StringValidator().equals('test').validate('test2');
    expect(value.ok).toBe(false);

    value = new StringValidator().notEquals('test').validate('test');
    expect(value.ok).toBe(false);

    value = new StringValidator().notEquals('test').validate('test2');
  });

  test('#validateResults', () => {
    const error1 = new StringValidator().notEmpty().validate('');
    const error2 = new StringValidator().alphanumeric().validate('abc33$$');

    try {
      validateResults([error1, error2]);
    } catch (e: any) {
      expect(e.message).toBe(
        `Validation Error: Result at index 0: String length must be greater than or equal to 1 but was 0.\nResult at index 1: Value must contain only alphanumeric characters.`
      );
    }
  });
});
