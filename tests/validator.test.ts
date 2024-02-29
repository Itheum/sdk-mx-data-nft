import { Validator, validateResults } from '../src/common/validator';

describe('test validator', () => {
  test('#test validator', () => {
    let value = new Validator().notEmpty().validate('');
    expect(value.ok).toBe(false);

    value = new Validator().notEmpty().validate('test');
    expect(value.ok).toBe(true);

    value = new Validator().alphanumeric().validate('tes333t');
    expect(value.ok).toBe(true);

    value = new Validator().alphanumeric().validate('tes333t@');
    expect(value.ok).toBe(false);

    value = new Validator().numeric().validate('333');
    expect(value.ok).toBe(true);

    value = new Validator().numeric().validate('333@');
    expect(value.ok).toBe(false);

    value = new Validator().numeric().validate('aabb@');
    expect(value.ok).toBe(false);

    value = new Validator().minValue(10).validate('9');
    expect(value.ok).toBe(false);

    value = new Validator().minValue(10).validate('11');
    expect(value.ok).toBe(true);

    value = new Validator().maxValue(10).validate('11');
    expect(value.ok).toBe(false);

    value = new Validator().maxValue(10).validate('9');
    expect(value.ok).toBe(true);

    value = new Validator().maxLength(10).validate('123456789011');
    expect(value.ok).toBe(false);

    value = new Validator().maxLength(10).validate('123456789');
    expect(value.ok).toBe(true);

    value = new Validator().minLength(10).validate('123456789');
    expect(value.ok).toBe(false);

    value = new Validator().minLength(10).validate('123456789011');
    expect(value.ok).toBe(true);

    value = new Validator().equals('test').validate('test');
    expect(value.ok).toBe(true);

    value = new Validator().equals('test').validate('test2');
    expect(value.ok).toBe(false);

    value = new Validator().notEquals('test').validate('test');
    expect(value.ok).toBe(false);

    value = new Validator().notEquals('test').validate('test2');
  });

  test('#validateResults', () => {
    const error1 = new Validator().notEmpty().validate('');
    const error2 = new Validator().alphanumeric().validate('abc33$$');

    try {
      validateResults([error1, error2]);
    } catch (e: any) {
      expect(e.message).toBe(
        `Validation Error: Result at index 0: String length must be greater than or equal to 1 but was 0.\nResult at index 1: Value must contain only alphanumeric characters.`
      );
    }
  });
});
