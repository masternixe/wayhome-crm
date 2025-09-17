import { TransactionType, Currency } from '@wayhome/database';

export interface CommissionInput {
  type: TransactionType;
  amount: number;
  currency: Currency;
  splitRatio: number; // Percentage for primary agent (0-1)
}

export interface CommissionOutput {
  grossAmount: number;
  totalCommission: number;
  primaryAgentShare: number;
  collaboratorShare: number;
  currency: Currency;
}

export interface CurrencyRates {
  EUR_TO_ALL: number;
  ALL_TO_EUR: number;
}

export class CommissionService {
  private static readonly SALE_COMMISSION_RATE = 0.03; // 3%
  private static readonly RENT_COMMISSION_RATE = 0.5; // 50% of one month's rent

  constructor(private currencyRates: CurrencyRates) {}

  /**
   * Calculate commission for a transaction
   */
  calculateCommission(input: CommissionInput): CommissionOutput {
    const { type, amount, currency, splitRatio } = input;

    // Validate split ratio
    if (splitRatio < 0 || splitRatio > 1) {
      throw new Error('Split ratio must be between 0 and 1');
    }

    // Convert to EUR for consistent calculation
    const amountInEur = this.convertToEur(amount, currency);

    // Calculate total commission based on transaction type
    let totalCommissionEur: number;
    if (type === TransactionType.SALE) {
      totalCommissionEur = amountInEur * CommissionService.SALE_COMMISSION_RATE;
    } else if (type === TransactionType.RENT) {
      // For rent, the amount is monthly rent
      totalCommissionEur = amountInEur * CommissionService.RENT_COMMISSION_RATE;
    } else {
      throw new Error(`Invalid transaction type: ${type}`);
    }

    // Calculate agent shares
    const primaryAgentShareEur = totalCommissionEur * splitRatio;
    const collaboratorShareEur = totalCommissionEur * (1 - splitRatio);

    // Convert back to original currency if needed
    if (currency === Currency.ALL) {
      return {
        grossAmount: amount,
        totalCommission: this.convertFromEur(totalCommissionEur, Currency.ALL),
        primaryAgentShare: this.convertFromEur(primaryAgentShareEur, Currency.ALL),
        collaboratorShare: this.convertFromEur(collaboratorShareEur, Currency.ALL),
        currency: Currency.ALL,
      };
    }

    return {
      grossAmount: amount,
      totalCommission: totalCommissionEur,
      primaryAgentShare: primaryAgentShareEur,
      collaboratorShare: collaboratorShareEur,
      currency: Currency.EUR,
    };
  }

  /**
   * Calculate commission for multiple transactions
   */
  calculateBulkCommission(inputs: CommissionInput[]): CommissionOutput[] {
    return inputs.map(input => this.calculateCommission(input));
  }

  /**
   * Get commission rate for a transaction type
   */
  getCommissionRate(type: TransactionType): number {
    if (type === TransactionType.SALE) {
      return CommissionService.SALE_COMMISSION_RATE;
    } else if (type === TransactionType.RENT) {
      return CommissionService.RENT_COMMISSION_RATE;
    }
    throw new Error(`Invalid transaction type: ${type}`);
  }

  /**
   * Convert amount to EUR
   */
  private convertToEur(amount: number, currency: Currency): number {
    if (currency === Currency.EUR) {
      return amount;
    }
    return amount * this.currencyRates.ALL_TO_EUR;
  }

  /**
   * Convert amount from EUR
   */
  private convertFromEur(amount: number, targetCurrency: Currency): number {
    if (targetCurrency === Currency.EUR) {
      return amount;
    }
    return amount * this.currencyRates.EUR_TO_ALL;
  }

  /**
   * Update currency rates
   */
  updateCurrencyRates(rates: CurrencyRates): void {
    this.currencyRates = rates;
  }

  /**
   * Calculate agent earnings for a period
   */
  calculateAgentEarnings(
    transactions: Array<{
      type: TransactionType;
      amount: number;
      currency: Currency;
      isPrimary: boolean;
      splitRatio: number;
    }>
  ): {
    totalEarningsEur: number;
    totalEarningsAll: number;
    byType: {
      sale: { eur: number; all: number };
      rent: { eur: number; all: number };
    };
  } {
    let totalEarningsEur = 0;
    let saleEarningsEur = 0;
    let rentEarningsEur = 0;

    for (const transaction of transactions) {
      const commission = this.calculateCommission({
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        splitRatio: transaction.isPrimary ? transaction.splitRatio : 1 - transaction.splitRatio,
      });

      const agentShareEur = transaction.isPrimary
        ? this.convertToEur(commission.primaryAgentShare, commission.currency)
        : this.convertToEur(commission.collaboratorShare, commission.currency);

      totalEarningsEur += agentShareEur;

      if (transaction.type === TransactionType.SALE) {
        saleEarningsEur += agentShareEur;
      } else {
        rentEarningsEur += agentShareEur;
      }
    }

    return {
      totalEarningsEur,
      totalEarningsAll: this.convertFromEur(totalEarningsEur, Currency.ALL),
      byType: {
        sale: {
          eur: saleEarningsEur,
          all: this.convertFromEur(saleEarningsEur, Currency.ALL),
        },
        rent: {
          eur: rentEarningsEur,
          all: this.convertFromEur(rentEarningsEur, Currency.ALL),
        },
      },
    };
  }
}
