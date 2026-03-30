---
name: "pdf-processing"
description: "Automatically processes PDF files for extraction, conversion, and manipulation. Invoke when user needs to process PDF documents, extract text, merge PDFs, or convert files to/from PDF format."
---

# PDF Processing

Comprehensive guide for processing PDF files - extraction, conversion, merging, splitting, and content manipulation.

## Use Cases

- Extract text content from PDF invoices
- Convert PDF to images or text
- Merge multiple PDF files
- Split PDF into separate pages
- Extract tables from PDF
- Read and process PDF attachments in work logs

## Common Tools

### 1. pdf-parse (Node.js)

```javascript
import pdf from 'pdf-parse';

const extractText = async (pdfBuffer) => {
  const data = await pdf(pdfBuffer);
  return data.text;
};

const extractMetadata = async (pdfBuffer) => {
  const data = await pdf(pdfBuffer);
  return {
    title: data.info?.Title,
    author: data.info?.Author,
    pageCount: data.numpages,
    creationDate: data.info?.CreationDate
  };
};
```

### 2. pdf-lib (Node.js)

```javascript
import { PDFDocument } from 'pdf-lib';

const mergePdfs = async (pdfBuffers) => {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
};

const splitPdf = async (pdfBuffer, pageNumbers) => {
  const pdf = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();

  for (const pageNum of pageNumbers) {
    const [page] = await newPdf.copyPages(pdf, [pageNum - 1]);
    newPdf.addPage(page);
  }

  return await newPdf.save();
};
```

### 3. pdf2pic (PDF to Image)

```javascript
import { fromPath } from 'pdf2pic';

const convertPdfToImage = async (pdfPath, outputDir) => {
  const convert = fromPath(pdfPath, {
    density: 150,
    saveFilename: "page",
    savePath: outputDir,
    format: "png",
    width: 1200,
    height: 1200
  });

  const result = await convert.bulk(-1, true);
  return result;
};
```

## Freelancer Platform Use Cases

### 1. Invoice Processing

```javascript
const processInvoice = async (pdfBuffer) => {
  const text = await extractText(pdfBuffer);

  const invoiceData = {
    invoiceNumber: extractPattern(text, /发票号[：:]\s*(\S+)/),
    amount: extractPattern(text, /金额[：:]\s*([\d,.]+)/),
    date: extractPattern(text, /日期[：:]\s*(\d{4}-\d{2}-\d{2})/),
    companyName: extractPattern(text, /公司名称[：:]\s*(.+)/)
  };

  return invoiceData;
};
```

### 2. Work Log Attachment Processing

```javascript
const processWorkLogAttachment = async (pdfBuffer) => {
  const metadata = await extractMetadata(pdfBuffer);

  if (metadata.pageCount > 5) {
    throw new Error('Timesheet PDF exceeds maximum page limit');
  }

  const text = await extractText(pdfBuffer);

  const timesheetData = parseTimesheet(text);
  return {
    isValid: validateTimesheet(timesheetData),
    data: timesheetData,
    metadata
  };
};
```

## Best Practices

1. **File Size Limits**: Set maximum PDF size (e.g., 10MB)
2. **Page Limits**: Restrict processing to reasonable page counts
3. **Error Handling**: Handle corrupted or password-protected PDFs
4. **Async Processing**: Use queue for large batch processing
5. **Security**: Sanitize file uploads before processing

## Chinese Text Extraction

```javascript
const extractChineseText = async (pdfBuffer) => {
  const data = await pdf(pdfBuffer);

  const chineseText = data.text
    .split('')
    .filter(char => /[\u4e00-\u9fa5]/.test(char))
    .join('');

  return chineseText;
};
```
