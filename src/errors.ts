export class ErrNetworkConfig extends Error {
  public constructor() {
    super(
      'Network configuration is not set. Call setNetworkConfig static method before calling any method that requires network configuration.'
    );
  }
}

export class ErrDataNftCreation extends Error {
  public constructor() {
    super(`Could not create DataNft:`);
  }
}

export class ErrDecodeAttributes extends Error {
  public constructor() {
    super('Could not decode attributes');
  }
}

export class ErrAttributeNotSet extends Error {
  public constructor(attributeName: string) {
    super(`Attribute ${attributeName} is not set`);
  }
}

export class ErrArgumentNotSet extends Error {
  public constructor(argumentName: string, message: string) {
    super(`Argument ${argumentName} is not set. ${message}`);
  }
}

export class ErrFailedOperation extends Error {
  public constructor(methodName: string) {
    super(`Function failed: ${methodName}:`);
  }
}

export class ErrContractQuery extends Error {
  public constructor(message: string) {
    super(`Contract query failed: ${message}`);
  }
}
