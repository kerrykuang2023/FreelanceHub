export default class StorageService {
  private static isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  public static setItem(key: string, value: any) {
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  public static getItem(key: string): any {
    const value = localStorage.getItem(key);
    if (!value) return null;
    
    if (this.isJsonString(value)) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    return value;
  }

  public static removeItem(key: string) {
    localStorage.removeItem(key);
  }
}
