---
name: "excel-analysis"
description: "Quickly analyzes Excel data with formulas, pivot tables, and charts. Invoke when user needs to process Excel files, generate reports, analyze financial data, or create data visualizations."
---

# Excel Analysis

Comprehensive guide for analyzing Excel data, creating formulas, pivot tables, and generating reports.

## Use Cases

- Analyze payment/transaction data
- Generate financial reports
- Create pivot tables for data summarization
- Build charts and visualizations
- Process bulk invoice data
- Create timesheet summaries

## Common Tools

### 1. ExcelJS

```javascript
import ExcelJS from 'exceljs';

const readExcel = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet('Sheet1');

  const data = [];
  worksheet.eachRow((row, rowNumber) => {
    data.push({
      rowNumber,
      values: row.values
    });
  });

  return data;
};

const createExcelReport = async (data, outputPath) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  worksheet.columns = [
    { header: '日期', key: 'date', width: 15 },
    { header: '项目', key: 'project', width: 20 },
    { header: '工时', key: 'hours', width: 10 },
    { header: '金额', key: 'amount', width: 15 }
  ];

  worksheet.addRows(data);

  await workbook.xlsx.writeFile(outputPath);
};
```

### 2. xlsx (SheetJS)

```javascript
import * as XLSX from 'xlsx';

const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

const createExcelFromJson = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
};
```

## Freelancer Platform Use Cases

### 1. Payment Reconciliation Report

```javascript
const generateReconciliationReport = async (paymentData) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('对账明细');

  sheet.columns = [
    { header: '工时日期', key: 'workDate', width: 12 },
    { header: '项目名称', key: 'projectName', width: 20 },
    { header: '工时(小时)', key: 'hours', width: 10 },
    { header: '日薪', key: 'dailyRate', width: 12 },
    { header: '应付金额', key: 'expectedAmount', width: 15 },
    { header: '实付金额', key: 'actualAmount', width: 15 },
    { header: '差异', key: 'difference', width: 12 },
    { header: '状态', key: 'status', width: 10 }
  ];

  const rows = paymentData.map(item => ({
    workDate: formatDate(item.work_date),
    projectName: item.project_name,
    hours: item.hours,
    dailyRate: formatCurrency(item.daily_rate),
    expectedAmount: formatCurrency(item.expected_amount),
    actualAmount: formatCurrency(item.actual_amount),
    difference: formatCurrency(item.difference),
    status: getStatusText(item.status)
  }));

  sheet.addRows(rows);

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } };

  return workbook;
};
```

### 2. Invoice Summary

```javascript
const generateInvoiceSummary = (invoices) => {
  const summary = invoices.reduce((acc, invoice) => {
    const key = invoice.company_id;
    if (!acc[key]) {
      acc[key] = {
        companyName: invoice.company_name,
        totalAmount: 0,
        invoiceCount: 0,
        paidAmount: 0,
        pendingAmount: 0
      };
    }

    acc[key].totalAmount += invoice.total_amount;
    acc[key].invoiceCount += 1;

    if (invoice.status === 'paid') {
      acc[key].paidAmount += invoice.total_amount;
    } else {
      acc[key].pendingAmount += invoice.total_amount;
    }

    return acc;
  }, {});

  return Object.values(summary);
};
```

### 3. Work Hours Summary

```javascript
const calculateMonthlyHours = (workLogs, year, month) => {
  const monthlyData = workLogs
    .filter(log => {
      const date = new Date(log.work_date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    })
    .reduce((acc, log) => {
      const projectKey = log.project_id.toString();

      if (!acc[projectKey]) {
        acc[projectKey] = {
          projectName: log.project_name,
          totalHours: 0,
          days: new Set()
        };
      }

      acc[projectKey].totalHours += log.hours_worked;
      acc[projectKey].days.add(log.work_date);

      return acc;
    }, {});

  return Object.values(monthlyData);
};
```

## Formulas

### Common Excel Formulas

```javascript
const formulas = {
  sum: '=SUM(B2:B100)',
  average: '=AVERAGE(B2:B100)',
  count: '=COUNT(B2:B100)',
  vlookup: '=VLOOKUP(A2,Data!A:C,3,FALSE)',
  sumif: '=SUMIF(B:B,"SAP MM",C:C)',
  subtotal: '=SUBTOTAL(9,B2:B100)',
  sumproduct: '=SUMPRODUCT((A2:A100="已完成")*(C2:C100))'
};
```

## Charts

```javascript
const addChart = (worksheet, dataRange, chartType = 'bar') => {
  const chart = worksheet.addChart({
    type: chartType,
    title: '月度收入统计',
    series: [{
      name: '收入',
      range: dataRange
    }],
    style: 10
  });

  chart.setPosition('F2');
  chart.setSize(600, 300);
};
```

## Best Practices

1. **Column Width**: Set appropriate widths for readability
2. **Headers**: Bold and color-code headers
3. **Number Formatting**: Apply currency/date formats
4. **Frozen Rows**: Freeze header row for large datasets
5. **Data Validation**: Add dropdown lists for status fields
6. **Protected Sheets**: Protect formula cells from accidental edits
