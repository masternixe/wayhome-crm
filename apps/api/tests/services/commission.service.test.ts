import { CommissionService, CurrencyRates } from '../../src/services/commission.service';
import { TransactionType, Currency } from '@wayhome/database';

describe('CommissionService', () => {
  let service: CommissionService;
  const mockRates: CurrencyRates = {
    EUR_TO_ALL: 100,
    ALL_TO_EUR: 0.01,
  };

  beforeEach(() => {
    service = new CommissionService(mockRates);
  });

  describe('calculateCommission', () => {
    describe('Sale transactions', () => {
      it('should calculate 3% commission for sales in EUR', () => {
        const result = service.calculateCommission({
          type: TransactionType.SALE,
          amount: 100000,
          currency: Currency.EUR,
          splitRatio: 0.5,
        });

        expect(result.grossAmount).toBe(100000);
        expect(result.totalCommission).toBe(3000); // 3% of 100,000
        expect(result.primaryAgentShare).toBe(1500); // 50% of 3,000
        expect(result.collaboratorShare).toBe(1500); // 50% of 3,000
        expect(result.currency).toBe(Currency.EUR);
      });

      it('should calculate 3% commission for sales in ALL', () => {
        const result = service.calculateCommission({
          type: TransactionType.SALE,
          amount: 10000000, // 10M ALL = 100K EUR
          currency: Currency.ALL,
          splitRatio: 0.6,
        });

        expect(result.grossAmount).toBe(10000000);
        expect(result.totalCommission).toBe(300000); // 3% of 10M ALL
        expect(result.primaryAgentShare).toBe(180000); // 60% of 300K ALL
        expect(result.collaboratorShare).toBe(120000); // 40% of 300K ALL
        expect(result.currency).toBe(Currency.ALL);
      });

      it('should handle 100% split to primary agent', () => {
        const result = service.calculateCommission({
          type: TransactionType.SALE,
          amount: 50000,
          currency: Currency.EUR,
          splitRatio: 1,
        });

        expect(result.primaryAgentShare).toBe(1500); // 100% of commission
        expect(result.collaboratorShare).toBe(0);
      });

      it('should handle 0% split to primary agent', () => {
        const result = service.calculateCommission({
          type: TransactionType.SALE,
          amount: 50000,
          currency: Currency.EUR,
          splitRatio: 0,
        });

        expect(result.primaryAgentShare).toBe(0);
        expect(result.collaboratorShare).toBe(1500); // 100% of commission
      });
    });

    describe('Rent transactions', () => {
      it('should calculate 50% commission for rentals in EUR', () => {
        const result = service.calculateCommission({
          type: TransactionType.RENT,
          amount: 1000, // Monthly rent
          currency: Currency.EUR,
          splitRatio: 0.5,
        });

        expect(result.grossAmount).toBe(1000);
        expect(result.totalCommission).toBe(500); // 50% of 1,000
        expect(result.primaryAgentShare).toBe(250); // 50% of 500
        expect(result.collaboratorShare).toBe(250); // 50% of 500
        expect(result.currency).toBe(Currency.EUR);
      });

      it('should calculate 50% commission for rentals in ALL', () => {
        const result = service.calculateCommission({
          type: TransactionType.RENT,
          amount: 100000, // 100K ALL = 1K EUR monthly rent
          currency: Currency.ALL,
          splitRatio: 0.7,
        });

        expect(result.grossAmount).toBe(100000);
        expect(result.totalCommission).toBe(50000); // 50% of 100K ALL
        expect(result.primaryAgentShare).toBe(35000); // 70% of 50K ALL
        expect(result.collaboratorShare).toBe(15000); // 30% of 50K ALL
        expect(result.currency).toBe(Currency.ALL);
      });
    });

    describe('Edge cases', () => {
      it('should throw error for invalid split ratio', () => {
        expect(() => {
          service.calculateCommission({
            type: TransactionType.SALE,
            amount: 100000,
            currency: Currency.EUR,
            splitRatio: 1.5,
          });
        }).toThrow('Split ratio must be between 0 and 1');

        expect(() => {
          service.calculateCommission({
            type: TransactionType.SALE,
            amount: 100000,
            currency: Currency.EUR,
            splitRatio: -0.1,
          });
        }).toThrow('Split ratio must be between 0 and 1');
      });

      it('should handle decimal split ratios', () => {
        const result = service.calculateCommission({
          type: TransactionType.SALE,
          amount: 100000,
          currency: Currency.EUR,
          splitRatio: 0.75,
        });

        expect(result.primaryAgentShare).toBe(2250); // 75% of 3,000
        expect(result.collaboratorShare).toBe(750); // 25% of 3,000
      });
    });
  });

  describe('calculateBulkCommission', () => {
    it('should calculate commission for multiple transactions', () => {
      const inputs = [
        {
          type: TransactionType.SALE,
          amount: 100000,
          currency: Currency.EUR,
          splitRatio: 0.5,
        },
        {
          type: TransactionType.RENT,
          amount: 1000,
          currency: Currency.EUR,
          splitRatio: 0.6,
        },
      ];

      const results = service.calculateBulkCommission(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].totalCommission).toBe(3000);
      expect(results[1].totalCommission).toBe(500);
    });
  });

  describe('getCommissionRate', () => {
    it('should return correct commission rates', () => {
      expect(service.getCommissionRate(TransactionType.SALE)).toBe(0.03);
      expect(service.getCommissionRate(TransactionType.RENT)).toBe(0.5);
    });

    it('should throw error for invalid transaction type', () => {
      expect(() => {
        service.getCommissionRate('INVALID' as TransactionType);
      }).toThrow('Invalid transaction type');
    });
  });

  describe('calculateAgentEarnings', () => {
    it('should calculate total earnings for an agent', () => {
      const transactions = [
        {
          type: TransactionType.SALE,
          amount: 100000,
          currency: Currency.EUR,
          isPrimary: true,
          splitRatio: 0.6,
        },
        {
          type: TransactionType.SALE,
          amount: 5000000, // 50K EUR
          currency: Currency.ALL,
          isPrimary: false,
          splitRatio: 0.5, // Agent gets 50% as collaborator
        },
        {
          type: TransactionType.RENT,
          amount: 1000,
          currency: Currency.EUR,
          isPrimary: true,
          splitRatio: 1, // No collaborator
        },
      ];

      const earnings = service.calculateAgentEarnings(transactions);

      // First transaction: 100K * 0.03 * 0.6 = 1,800 EUR
      // Second transaction: 50K * 0.03 * 0.5 = 750 EUR
      // Third transaction: 1K * 0.5 * 1 = 500 EUR
      expect(earnings.totalEarningsEur).toBe(3050);
      expect(earnings.totalEarningsAll).toBe(305000);

      expect(earnings.byType.sale.eur).toBe(2550);
      expect(earnings.byType.sale.all).toBe(255000);
      expect(earnings.byType.rent.eur).toBe(500);
      expect(earnings.byType.rent.all).toBe(50000);
    });

    it('should handle empty transactions', () => {
      const earnings = service.calculateAgentEarnings([]);

      expect(earnings.totalEarningsEur).toBe(0);
      expect(earnings.totalEarningsAll).toBe(0);
      expect(earnings.byType.sale.eur).toBe(0);
      expect(earnings.byType.rent.eur).toBe(0);
    });
  });

  describe('updateCurrencyRates', () => {
    it('should update currency rates and recalculate correctly', () => {
      const newRates: CurrencyRates = {
        EUR_TO_ALL: 120,
        ALL_TO_EUR: 1 / 120,
      };

      service.updateCurrencyRates(newRates);

      const result = service.calculateCommission({
        type: TransactionType.SALE,
        amount: 1200000, // 10K EUR at new rate
        currency: Currency.ALL,
        splitRatio: 0.5,
      });

      expect(result.totalCommission).toBe(36000); // 3% of 1.2M ALL
    });
  });
});
