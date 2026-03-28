export class TaxCalculator {
  static readonly PERSONAL_INCOME_TAX_TIERS = [
    { min: 0, max: 3000, rate: 0.20, deduction: 0 },
    { min: 3000, max: 12000, rate: 0.25, deduction: 210 },
    { min: 12000, max: 25000, rate: 0.20, deduction: 1410 },
    { min: 25000, max: 35000, rate: 0.25, deduction: 2660 },
    { min: 35000, max: 55000, rate: 0.30, deduction: 4410 },
    { min: 55000, max: 80000, rate: 0.35, deduction: 7160 },
    { min: 80000, max: Infinity, rate: 0.45, deduction: 15160 },
  ];

  static splitTaxFromGross(grossAmount: number, taxRate: number): { exclTax: number; tax: number } {
    if (grossAmount < 0 || taxRate < 0 || taxRate > 100) {
      throw new Error("Invalid input: amount and tax rate must be non-negative");
    }
    const exclTax = grossAmount / (1 + taxRate / 100);
    const tax = grossAmount - exclTax;
    return {
      exclTax: Math.round(exclTax * 100) / 100,
      tax: Math.round(tax * 100) / 100,
    };
  }

  static addTaxToNet(netAmount: number, taxRate: number): { inclTax: number; tax: number } {
    if (netAmount < 0 || taxRate < 0 || taxRate > 100) {
      throw new Error("Invalid input: amount and tax rate must be non-negative");
    }
    const tax = netAmount * (taxRate / 100);
    const inclTax = netAmount + tax;
    return {
      inclTax: Math.round(inclTax * 100) / 100,
      tax: Math.round(tax * 100) / 100,
    };
  }

  static calculatePersonalIncomeTax(incomeAmount: number): {
    preTax: number;
    taxableAmount: number;
    taxRate: number;
    deduction: number;
    tax: number;
    netIncome: number;
  } {
    if (incomeAmount < 0) {
      throw new Error("Income amount must be non-negative");
    }
    const tier = this.PERSONAL_INCOME_TAX_TIERS.find(
      (t) => incomeAmount >= t.min && incomeAmount < t.max
    );
    if (!tier) {
      throw new Error("Unable to find applicable tax tier");
    }
    const taxableAmount = incomeAmount;
    const tax = taxableAmount * tier.rate - tier.deduction;
    const netIncome = incomeAmount - tax;
    return {
      preTax: incomeAmount,
      taxableAmount,
      taxRate: tier.rate,
      deduction: tier.deduction,
      tax: Math.round(tax * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
    };
  }

  static calculateVAT(inputAmount: number, taxRate: number, isInclusive: boolean): {
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  } {
    if (isInclusive) {
      const result = this.splitTaxFromGross(inputAmount, taxRate);
      return {
        netAmount: result.exclTax,
        vatAmount: result.tax,
        grossAmount: inputAmount,
      };
    } else {
      const result = this.addTaxToNet(inputAmount, taxRate);
      return {
        netAmount: inputAmount,
        vatAmount: result.tax,
        grossAmount: result.inclTax,
      };
    }
  }

  static calculateFreelancerPayment(params: {
    grossAmount: number;
    isTaxInclusive: boolean;
    vatRate: number;
    personalIncomeTaxRate?: number;
    platformFeeRate?: number;
    companyCommissionRate?: number;
  }): {
    grossAmount: number;
    netAmount: number;
    vatAmount: number;
    vatNetAmount: number;
    personalIncomeTax: number;
    personalIncomeTaxNet: number;
    platformFee: number;
    companyCommission: number;
    totalDeductions: number;
    freelancerNetIncome: number;
    freelancerGrossIncome: number;
  } {
    const {
      grossAmount,
      isTaxInclusive,
      vatRate,
      personalIncomeTaxRate = 0,
      platformFeeRate = 0,
      companyCommissionRate = 0,
    } = params;

    if (grossAmount < 0) {
      throw new Error("Gross amount must be non-negative");
    }

    let vatNetAmount: number;
    let vatAmount: number;
    let netAmount: number;

    if (isTaxInclusive) {
      const splitResult = this.splitTaxFromGross(grossAmount, vatRate);
      vatNetAmount = splitResult.exclTax;
      vatAmount = splitResult.tax;
      netAmount = splitResult.exclTax;
    } else {
      const addResult = this.addTaxToNet(grossAmount, vatRate);
      vatNetAmount = grossAmount;
      vatAmount = addResult.tax;
      netAmount = grossAmount;
    }

    let personalIncomeTax = 0;
    let personalIncomeTaxNet = vatNetAmount;

    if (personalIncomeTaxRate > 0) {
      const pitResult = this.calculatePersonalIncomeTax(vatNetAmount * personalIncomeTaxRate);
      personalIncomeTax = pitResult.tax;
      personalIncomeTaxNet = vatNetAmount - personalIncomeTax;
    }

    const platformFee = netAmount * (platformFeeRate / 100);
    const companyCommission = netAmount * (companyCommissionRate / 100);
    const totalDeductions = vatAmount + personalIncomeTax + platformFee + companyCommission;
    const freelancerNetIncome = netAmount - platformFee - companyCommission;
    const freelancerGrossIncome = grossAmount - totalDeductions;

    return {
      grossAmount: Math.round(grossAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      vatNetAmount: Math.round(vatNetAmount * 100) / 100,
      personalIncomeTax: Math.round(personalIncomeTax * 100) / 100,
      personalIncomeTaxNet: Math.round(personalIncomeTaxNet * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      companyCommission: Math.round(companyCommission * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      freelancerNetIncome: Math.round(freelancerNetIncome * 100) / 100,
      freelancerGrossIncome: Math.round(freelancerGrossIncome * 100) / 100,
    };
  }

  static calculateWorkLogBilling(params: {
    hoursOrDays: number;
    unit: "小时" | "天";
    dailyOrHourlyRate: number;
    isTaxInclusive: boolean;
    taxRate: number;
  }): {
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    taxInclusiveAmount: number;
    taxExclusiveAmount: number;
  } {
    const { hoursOrDays, unit, dailyOrHourlyRate, isTaxInclusive, taxRate } = params;

    const subtotal = hoursOrDays * dailyOrHourlyRate;

    if (isTaxInclusive) {
      const { exclTax, tax } = this.splitTaxFromGross(subtotal, taxRate);
      return {
        quantity: hoursOrDays,
        unit,
        unitPrice: dailyOrHourlyRate,
        subtotal: Math.round(subtotal * 100) / 100,
        taxRate,
        taxAmount: Math.round(tax * 100) / 100,
        totalAmount: Math.round(subtotal * 100) / 100,
        taxInclusiveAmount: Math.round(subtotal * 100) / 100,
        taxExclusiveAmount: Math.round(exclTax * 100) / 100,
      };
    } else {
      const { inclTax, tax } = this.addTaxToNet(subtotal, taxRate);
      return {
        quantity: hoursOrDays,
        unit,
        unitPrice: dailyOrHourlyRate,
        subtotal: Math.round(subtotal * 100) / 100,
        taxRate,
        taxAmount: Math.round(tax * 100) / 100,
        totalAmount: Math.round(inclTax * 100) / 100,
        taxInclusiveAmount: Math.round(inclTax * 100) / 100,
        taxExclusiveAmount: Math.round(subtotal * 100) / 100,
      };
    }
  }

  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    const rates: Record<string, number> = {
      CNY: 1,
      USD: 7.24,
      EUR: 7.85,
      GBP: 9.12,
      RUB: 0.079,
    };

    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new Error("Unsupported currency");
    }

    const inCNY = amount * rates[fromCurrency];
    return Math.round((inCNY / rates[toCurrency]) * 100) / 100;
  }

  static numberToChineseWords(num: number): string {
    const units = ["", "万", "亿"];
    const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

    if (num === 0) return "零元整";

    const intPart = Math.floor(num);
    const decimalPart = Math.round((num - intPart) * 100);

    let result = "";
    let str = intPart.toString();
    let len = str.length;

    for (let i = 0; i < len; i++) {
      const n = parseInt(str[i]);
      const unitIndex = Math.floor((len - i - 1) / 4);
      const posInUnit = (len - i - 1) % 4;

      if (n !== 0) {
        if (posInUnit === 0 && unitIndex > 0) {
          result += units[unitIndex];
        }
        result += digits[n];
        if (posInUnit === 3 && unitIndex > 0) {
          result += units[unitIndex];
        }
      } else {
        if (posInUnit === 0 && i < len - 1) {
          const nextN = parseInt(str[i + 1]);
          if (nextN !== 0) {
            result += digits[0];
          }
        }
      }
    }

    result += "元";

    if (decimalPart > 0) {
      const decimalStr = decimalPart.toString().padStart(2, "0");
      const jiao = parseInt(decimalStr[0]);
      const fen = parseInt(decimalStr[1]);

      if (jiao > 0) {
        result += digits[jiao] + "角";
      }
      if (fen > 0) {
        result += digits[fen] + "分";
      }
    } else {
      result += "整";
    }

    return result;
  }
}

export default TaxCalculator;
