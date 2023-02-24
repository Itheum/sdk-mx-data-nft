export interface Claim {
  identifier: string,
  from: string,
  to: string,
  data: any,
  validFrom: number,
  validTo: number,
  signature?: string,
}