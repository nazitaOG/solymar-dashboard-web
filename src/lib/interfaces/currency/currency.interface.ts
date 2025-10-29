export type Currency = "USD" | "ARS";

export interface CurrencyTotal {
  currency: Currency;      // coincide con enum de Prisma
  totalPrice: number;      // Decimal(18,2)
  amountPaid: number;      // Decimal(18,2)
}