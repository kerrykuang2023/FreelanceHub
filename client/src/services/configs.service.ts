import adminService, { ISystemConfig } from "./admin.service";

class ConfigsService {
  private cache: Map<string, { data: ISystemConfig[]; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000;

  private async getConfigs(configType: string, forceRefresh = false): Promise<ISystemConfig[]> {
    const now = Date.now();
    const cached = this.cache.get(configType);

    if (!forceRefresh && cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await adminService.getSystemConfigs(configType);
      const data = response.data.data || [];
      this.cache.set(configType, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${configType}:`, error);
      if (cached) return cached.data;
      return [];
    }
  }

  public async getWorkTypes(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("work_type", forceRefresh);
  }

  public async getTaxRates(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("tax_rate", forceRefresh);
  }

  public async getCurrencies(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("currency", forceRefresh);
  }

  public async getLanguages(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("language", forceRefresh);
  }

  public async getJobNatures(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("job_nature", forceRefresh);
  }

  public async getWorkFormats(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("work_format", forceRefresh);
  }

  public async getRateTypes(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("rate_type", forceRefresh);
  }

  public async getInvoiceTypes(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("invoice_type", forceRefresh);
  }

  public async getPaymentMethods(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("payment_method", forceRefresh);
  }

  public async getSkillCategories(forceRefresh = false): Promise<ISystemConfig[]> {
    return this.getConfigs("skill_category", forceRefresh);
  }

  public clearCache() {
    this.cache.clear();
  }

  public clearCacheByType(configType: string) {
    this.cache.delete(configType);
  }
}

export default new ConfigsService();