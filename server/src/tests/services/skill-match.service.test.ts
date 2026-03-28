import SkillMatchService from '../services/skill-match.service';

describe('SkillMatchService', () => {
  describe('calculateSkillMatch', () => {
    it('should return 100 when all skills match', async () => {
      const result = await SkillMatchService.calculateSkillMatch({
        userSkillCategoryIds: ['cat1', 'cat2', 'cat3'],
        userSkillSubCategoryIds: ['sub1', 'sub2', 'sub3'],
        primarySkillIds: ['sub1'],
        requiredSkillCategoryIds: ['cat1', 'cat2'],
        requiredSkillSubCategoryIds: ['sub1', 'sub2'],
      });

      expect(result.score).toBe(100);
      expect(result.matchedSubCategories).toHaveLength(2);
      expect(result.primarySkillMatched).toBe(true);
    });

    it('should return 50 when half skills match', async () => {
      const result = await SkillMatchService.calculateSkillMatch({
        userSkillCategoryIds: ['cat1', 'cat2'],
        userSkillSubCategoryIds: ['sub1', 'sub2'],
        primarySkillIds: [],
        requiredSkillCategoryIds: ['cat1', 'cat2', 'cat3', 'cat4'],
        requiredSkillSubCategoryIds: ['sub1', 'sub2', 'sub3', 'sub4'],
      });

      expect(result.score).toBe(50);
      expect(result.matchedSubCategories).toHaveLength(2);
      expect(result.unmatchedSubCategories).toHaveLength(2);
    });

    it('should return 0 when no skills match', async () => {
      const result = await SkillMatchService.calculateSkillMatch({
        userSkillCategoryIds: ['cat1', 'cat2'],
        userSkillSubCategoryIds: ['sub1', 'sub2'],
        primarySkillIds: [],
        requiredSkillCategoryIds: ['cat3', 'cat4'],
        requiredSkillSubCategoryIds: ['sub3', 'sub4'],
      });

      expect(result.score).toBe(0);
      expect(result.matchedSubCategories).toHaveLength(0);
      expect(result.unmatchedSubCategories).toHaveLength(2);
    });

    it('should add bonus for primary skill match', async () => {
      const result = await SkillMatchService.calculateSkillMatch({
        userSkillCategoryIds: ['cat1'],
        userSkillSubCategoryIds: ['sub1'],
        primarySkillIds: ['sub1'],
        requiredSkillCategoryIds: ['cat1'],
        requiredSkillSubCategoryIds: ['sub1'],
      });

      expect(result.score).toBe(100);
      expect(result.primarySkillMatched).toBe(true);
    });

    it('should return 100 when no skills required', async () => {
      const result = await SkillMatchService.calculateSkillMatch({
        userSkillCategoryIds: ['cat1', 'cat2'],
        userSkillSubCategoryIds: ['sub1', 'sub2'],
        primarySkillIds: [],
        requiredSkillCategoryIds: [],
        requiredSkillSubCategoryIds: [],
      });

      expect(result.score).toBe(100);
    });
  });
});
