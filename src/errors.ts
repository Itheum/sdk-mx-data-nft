/**
 * The base class for exceptions (errors).
 */
export class Err extends Error {
  inner: Error | undefined = undefined;

  public constructor(message: string, inner?: Error) {
    super(message);
    this.inner = inner;
  }

  /**
   * Returns a pretty, friendly summary for the error or for the chain of errors (if appropriate).
   */
  summary(): any[] {
    let result = [];

    result.push({ name: this.name, message: this.message });

    let inner: any = this.inner;
    while (inner) {
      result.push({ name: inner.name, message: inner.message });
      inner = inner.inner;
    }

    return result;
  }
}

export class ErrNetworkConfig extends Err {
  public constructor() {
    super(
      'Network configuration is not set. Call setNetworkConfig static method before calling any method that requires network configuration.'
    );
  }
}

export class ErrDataNftCreation extends Err {
  public constructor(inner?: Error) {
    super(`Could not create DataNft:`, inner);
  }
}

export class ErrDecodeAttributes extends Err {
  public constructor() {
    super('Could not decode attributes');
  }
}

export class ErrAttributeNotSet extends Err {
  public constructor(attributeName: string) {
    super(`Attribute ${attributeName} is not set`);
  }
}

export class ErrArgumentNotSet extends Err {
  public constructor(argumentName: string, message: string) {
    super(`Argument ${argumentName} is not set. ${message}`);
  }
}

export class ErrFailedOperation extends Err {
  public constructor(methodName: string, inner?: Error) {
    super(`Function failed: ${methodName}:`, inner);
  }
}

export class ErrContractQuery extends Err {
  public constructor(message: string) {
    super(`Contract query failed: ${message}`);
  }
}
