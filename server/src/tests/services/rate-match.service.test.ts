import RateMatchService from '../services/rate-match.service';

describe('RateMatchService', () => {
  describe('calculateRateMatch', () => {
    it('should return 100 when rate is within budget', async () => {
      const result = await RateMatchService.calculateRateMatch({
        userRate: { daily: 2000, currency: 'CNY' },
        projectBudget: { min: 1500, max: 2500, currency: 'CNY', rateType: '日薪' },
      });

      expect(result.score).toBe(100);
      expect(result.matchType).toBe('within_budget');
    });

    it('should return 80 when rate is slightly over budget (10%)', async () => {
      const result = await RateMatchService.calculateRateMatch({
        userRate: { daily: 2600, currency: 'CNY' },
        projectBudget: { min: 1500, max: 2500, currency: 'CNY', rateType: '日薪' },
      });

      expect(result.score).toBe(80);
      expect(result.matchType).toBe('slightly_over');
    });

    it('should return 50 when rate is over budget', async () => {
      const result = await RateMatchService.calculateRateMatch({
        userRate: { daily: 3500, currency: 'CNY' },
        projectBudget: { min: 1500, max: 2500, currency: 'CNY', rateType: '日薪' },
      });

      expect(result.score).toBe(50);
      expect(result.matchType).toBe('over_budget');
    });

    it('should return 50 for unknown rate type', async () => {
      const result = await RateMatchService.calculateRateMatch({
        userRate: { daily: 2000, currency: 'CNY' },
        projectBudget: { min: 0, max: 0, currency: 'CNY', rateType: '待面试' },
      });

      expect(result.score).toBe(50);
      expect(result.matchType).toBe('unknown');
    });

    it('should convert currencies correctly', async () => {
      const result = await RateMatchService.calculateRateMatch({
        userRate: { daily: 300, currency: 'USD' },
        projectBudget: { min: 1500, max: 2500, currency: 'CNY', rateType: '日薪' },
      });

      expect(result.score).toBe(100);
      expect(result.matchType).toBe('within_budget');
    });
  });
});
