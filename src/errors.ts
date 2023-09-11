export class ErrNetworkConfig extends Error {
  public constructor(message?: string) {
    super(
      message ||
        'Network configuration is not set. Call setNetworkConfig static method before calling any method that requires network configuration.'
    );
  }
}

export class ErrInvalidArgument extends Error {
  public constructor(message: string) {
    super(`Invalid argument: ${message}`);
  }
}

export class ErrBadType extends Error {
  public constructor(name: string, type: any, value?: any, context?: string) {
    super(
      `Bad type of "${name}": ${value}. Expected type: ${type}. Context: ${context}`
    );
  }
}

export class ErrDataNftCreate extends Error {
  public constructor(message?: string) {
    super(`Failed to create Data NFT: ${message}`);
  }
}

export class ErrFetch extends Error {
  public constructor(status: number, message: string) {
    super(`Fetch error with status code: ${status} and message: ${message}`);
  }
}

export class ErrDecodeAttributes extends Error {
  public constructor(message?: string) {
    super(`Failed to decode attributes: ${message}`);
  }
}

export class ErrAttributeNotSet extends Error {
  public constructor(attribute: string) {
    super(`Attribute "${attribute}" is not set`);
  }
}

export class ErrContractQuery extends Error {
  public constructor(method: string, message?: string) {
    super(`Failed to query contract: Method: ${method} : ${message}`);
  }
}

export class ErrParamValidation extends Error {
  public constructor(message: string) {
    super(`Params have validation issues : ${message}`);
  }
}

export class ErrFailedOperation extends Error {
  public constructor(method: string, message?: string) {
    super(`Failed to perform operation: ${method} : ${message}`);
  }
}
