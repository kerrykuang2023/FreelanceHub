import AvailabilityMatchService from '../services/availability-match.service';

describe('AvailabilityMatchService', () => {
  describe('calculateAvailabilityMatch', () => {
    it('should return 100 when fully available', async () => {
      const result = await AvailabilityMatchService.calculateAvailabilityMatch({
        userAvailability: {
          availableFrom: new Date('2024-01-01'),
          availableTo: new Date('2024-12-31'),
          status: 'available',
          bookedPeriods: [],
        },
        projectPeriod: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-31'),
        },
      });

      expect(result.score).toBe(100);
      expect(result.matchType).toBe('fully_available');
    });

    it('should return 60 when partially available', async () => {
      const result = await AvailabilityMatchService.calculateAvailabilityMatch({
        userAvailability: {
          availableFrom: new Date('2024-01-01'),
          availableTo: new Date('2024-12-31'),
          status: 'available',
          bookedPeriods: [
            { start: new Date('2024-02-15'), end: new Date('2024-02-28') },
          ],
        },
        projectPeriod: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-31'),
        },
      });

      expect(result.score).toBe(60);
      expect(result.matchType).toBe('partially_available');
    });

    it('should return 0 when not available', async () => {
      const result = await AvailabilityMatchService.calculateAvailabilityMatch({
        userAvailability: {
          availableFrom: new Date('2024-01-01'),
          availableTo: new Date('2024-12-31'),
          status: 'not_available',
          bookedPeriods: [],
        },
        projectPeriod: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-31'),
        },
      });

      expect(result.score).toBe(0);
      expect(result.matchType).toBe('conflict');
    });

    it('should return 50 when project period is unknown', async () => {
      const result = await AvailabilityMatchService.calculateAvailabilityMatch({
        userAvailability: {
          availableFrom: new Date('2024-01-01'),
          availableTo: new Date('2024-12-31'),
          status: 'available',
          bookedPeriods: [],
        },
        projectPeriod: {
          startDate: undefined,
          endDate: undefined,
        },
      });

      expect(result.score).toBe(50);
      expect(result.matchType).toBe('unknown');
    });
  });
});
