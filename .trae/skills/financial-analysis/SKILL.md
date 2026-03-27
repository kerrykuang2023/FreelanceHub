---
name: "financial-analysis"
description: "Performs financial analysis including tax calculations, invoicing, and payment processing. Invoke when user needs to calculate taxes, generate invoices, analyze financial data, or process payments."
---

# Financial Analysis

Comprehensive guide for financial calculations, tax processing, invoice generation, and financial data analysis.

## Use Cases

- Calculate VAT and personal income tax
- Generate professional invoices
- Analyze payment data
- Process freelancer payments
- Create financial reports
- Handle tax-inclusive/exclusive pricing

## Tax Calculations

### 1. VAT (Value Added Tax)

```typescript
class TaxCalculator {
  static splitTaxFromGross(grossAmount: number, taxRate: number): {
    exclTax: number;
    tax: number;
  } {
    const exclTax = grossAmount / (1 + taxRate / 100);
    const tax = grossAmount - exclTax;
    return {
      exclTax: Math.round(exclTax * 100) / 100,
      tax: Math.round(tax * 100) / 100
    };
  }

  static addTaxToNet(netAmount: number, taxRate: number): {
    inclTax: number;
    tax: number;
  } {
    const tax = netAmount * (taxRate / 100);
    const inclTax = netAmount + tax;
    return {
      inclTax: Math.round(inclTax * 100) / 100,
      tax: Math.round(tax * 100) / 100
    };
  }
}
```

### 2. Personal Income Tax (个税)

```typescript
const PERSONAL_INCOME_TAX_TIERS = [
  { min: 0, max: 3000, rate: 0.20, deduction: 0 },
  { min: 3000, max: 12000, rate: 0.25, deduction: 210 },
  { min: 12000, max: 25000, rate: 0.20, deduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, deduction: 2660 },
  { min: 35000, max: 55000, rate: 0.30, deduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, deduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, deduction: 15160 }
];

const calculatePersonalIncomeTax = (incomeAmount: number) => {
  const tier = PERSONAL_INCOME_TAX_TIERS.find(
    t => incomeAmount >= t.min && incomeAmount < t.max
  );

  const tax = incomeAmount * tier.rate - tier.deduction;
  const netIncome = incomeAmount - tax;

  return {
    preTax: incomeAmount,
    taxableAmount: incomeAmount,
    taxRate: tier.rate,
    deduction: tier.deduction,
    tax: Math.round(tax * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100
  };
};
```

## Invoice Generation

### 1. Invoice Model

```typescript
interface Invoice {
  invoice_number: string;
  invoice_type: "增值税专用发票" | "增值税普通发票" | "个人发票";

  items: [{
    description: string;
    quantity: number;
    unit: "天" | "月" | "小时" | "项目";
    unit_price: number;
    amount: number;
  }];

  subtotal_amount: number;
  tax_calculation_mode: "含税价" | "不含税价";
  tax_rate: number;
  tax_amount: number;
  total_amount: number;

  billing_info: {
    billing_company_name: string;
    billing_tax_id: string;
    billing_address: string;
    billing_bank_name: string;
    billing_bank_account: string;
  };
}
```

### 2. Invoice Calculation

```typescript
const calculateInvoice = (items, taxInclusive, taxRate) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  let exclTax, taxAmount, totalAmount;

  if (taxInclusive) {
    exclTax = subtotal / (1 + taxRate / 100);
    taxAmount = subtotal - exclTax;
    totalAmount = subtotal;
  } else {
    exclTax = subtotal;
    taxAmount = subtotal * (taxRate / 100);
    totalAmount = subtotal + taxAmount;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    exclTax: Math.round(exclTax * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};
```

### 3. Amount to Chinese Words

```typescript
const numberToChineseWords = (num: number): string => {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "万", "亿"];

  if (num === 0) return "零元整";

  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);

  let result = "";
  let str = intPart.toString();
  let len = str.length;

  for (let i = 0; i < len; i++) {
    const n = parseInt(str[i]);
    const posInUnit = (len - i - 1) % 4;

    if (n !== 0) {
      result += digits[n];
      if (posInUnit === 3) result += "千";
      if (posInUnit === 2) result += "百";
      if (posInUnit === 1) result += "十";
    } else if (posInUnit === 1 && i < len - 1) {
      result += "零";
    }
  }

  result += "元";

  if (decimalPart > 0) {
    const jiao = Math.floor(decimalPart / 10);
    const fen = decimalPart % 10;
    if (jiao > 0) result += digits[jiao] + "角";
    if (fen > 0) result += digits[fen] + "分";
  } else {
    result += "整";
  }

  return result;
};
```

## Payment Processing

### 1. Work Log Billing

```typescript
interface WorkLogBilling {
  workDate: Date;
  hoursWorked: number;
  dailyRate: number;
  isTaxInclusive: boolean;
  taxRate: number;
}

const calculateWorkLogBilling = (params: WorkLogBilling) => {
  const { hoursWorked, dailyRate, isTaxInclusive, taxRate } = params;

  const subtotal = hoursWorked * dailyRate;

  if (isTaxInclusive) {
    const exclTax = subtotal / (1 + taxRate / 100);
    const taxAmount = subtotal - exclTax;

    return {
      quantity: hoursWorked,
      unit: "天",
      unitPrice: dailyRate,
      subtotal,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: subtotal,
      taxInclusiveAmount: subtotal,
      taxExclusiveAmount: Math.round(exclTax * 100) / 100
    };
  } else {
    const inclTax = subtotal * (1 + taxRate / 100);
    const taxAmount = subtotal * (taxRate / 100);

    return {
      quantity: hoursWorked,
      unit: "天",
      unitPrice: dailyRate,
      subtotal,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(inclTax * 100) / 100,
      taxInclusiveAmount: Math.round(inclTax * 100) / 100,
      taxExclusiveAmount: subtotal
    };
  }
};
```

## Financial Reports

### 1. Monthly Summary

```typescript
const generateMonthlyFinancialSummary = (workLogs, invoices, payments) => {
  const summary = {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    pendingPayments: 0,
    collectedPayments: 0,
    byProject: {} as Record<string, any>,
    byCompany: {} as Record<string, any>
  };

  workLogs.forEach(log => {
    const projectKey = log.project_id.toString();
    const companyKey = log.company_id.toString();

    summary.totalRevenue += log.billing_info.total_amount;

    if (!summary.byProject[projectKey]) {
      summary.byProject[projectKey] = { name: log.project_name, total: 0, hours: 0 };
    }
    summary.byProject[projectKey].total += log.billing_info.total_amount;
    summary.byProject[projectKey].hours += log.hours_worked;

    if (!summary.byCompany[companyKey]) {
      summary.byCompany[companyKey] = { name: log.company_name, total: 0 };
    }
    summary.byCompany[companyKey].total += log.billing_info.total_amount;
  });

  invoices.forEach(inv => {
    if (inv.status === "paid") {
      summary.collectedPayments += inv.total_amount;
    } else {
      summary.pendingPayments += inv.total_amount;
    }
  });

  summary.netIncome = summary.collectedPayments - summary.totalExpenses;

  return summary;
};
```

### 2. Tax Breakdown Report

```typescript
const generateTaxBreakdown = (workLogs) => {
  return workLogs.reduce((acc, log) => {
    const grossAmount = log.billing_info.total_amount;
    const taxRate = log.billing_info.tax_rate;

    const vatAmount = log.billing_info.tax_amount;

    acc.grossAmount += grossAmount;
    acc.vatAmount += vatAmount;
    acc.netAmount += (grossAmount - vatAmount);

    return acc;
  }, { grossAmount: 0, vatAmount: 0, netAmount: 0 });
};
```

## Currency Formatting

```typescript
const formatCurrency = (amount: number, currency = 'CNY'): string => {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    RUB: '₽'
  };

  return `${symbols[currency] || symbols.CNY}${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
```
