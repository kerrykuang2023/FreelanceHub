import LocationMatchService from '../services/location-match.service';

describe('LocationMatchService', () => {
  describe('calculateLocationMatch', () => {
    it('should return 100 for remote projects', async () => {
      const result = await LocationMatchService.calculateLocationMatch({
        userLocation: { city: 'Beijing', province: 'Beijing', country: 'China' },
        projectLocation: { city: 'Shanghai', province: 'Shanghai', country: 'China' },
        isRemote: true,
      });

      expect(result.score).toBe(100);
      expect(result.matchType).toBe('remote');
    });

    it('should return 100 for same city', async () => {
      const result = await LocationMatchService.calculateLocationMatch({
        userLocation: { city: 'Beijing', province: 'Beijing', country: 'China' },
        projectLocation: { city: 'Beijing', province: 'Beijing', country: 'China' },
        isRemote: false,
      });

      expect(result.score).toBe(100);
      expect(result.matchType).toBe('same_city');
    });

    it('should return 80 for same province', async () => {
      const result = await LocationMatchService.calculateLocationMatch({
        userLocation: { city: 'Shenzhen', province: 'Guangdong', country: 'China' },
        projectLocation: { city: 'Guangzhou', province: 'Guangdong', country: 'China' },
        isRemote: false,
      });

      expect(result.score).toBe(80);
      expect(result.matchType).toBe('same_province');
    });

    it('should return 60 for same country', async () => {
      const result = await LocationMatchService.calculateLocationMatch({
        userLocation: { city: 'Beijing', province: 'Beijing', country: 'China' },
        projectLocation: { city: 'Shanghai', province: 'Shanghai', country: 'China' },
        isRemote: false,
      });

      expect(result.score).toBe(60);
      expect(result.matchType).toBe('same_country');
    });

    it('should return 0 for no match', async () => {
      const result = await LocationMatchService.calculateLocationMatch({
        userLocation: { city: 'Beijing', province: 'Beijing', country: 'China' },
        projectLocation: { city: 'New York', province: 'NY', country: 'USA' },
        isRemote: false,
      });

      expect(result.score).toBe(0);
      expect(result.matchType).toBe('no_match');
    });

    it('should be case insensitive', async () => {
      const result = await LocationMatchService.calculateLocationMatch({
        userLocation: { city: 'BEIJING', province: 'BEIJING', country: 'CHINA' },
        projectLocation: { city: 'beijing', province: 'beijing', country: 'china' },
        isRemote: false,
      });

      expect(result.score).toBe(100);
      expect(result.matchType).toBe('same_city');
    });
  });
});
