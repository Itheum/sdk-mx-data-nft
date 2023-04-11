export interface MarketplaceRequirements {
  acceptedTokens: string[];
  acceptedPayments: string[];
  maximumPaymentFees: string[];
  buyerTaxPercentageDiscount: number;
  sellerTaxPercentageDiscount: number;
  buyerTaxPercentage: number;
  sellerTaxPercentage: number;
  finalBuyerTaxPercentage: number;
  finalSellerTaxPercentage: number;
}
