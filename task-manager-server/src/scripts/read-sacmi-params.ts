
import * as xlsx from 'xlsx';
import * as path from 'path';

const filePath = 'd:\\SAP\\docs\\Setting Parameter Sacmi 4.xlsx';

try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  console.log('Sheet Name:', sheetName);
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error('Error reading file:', error);
}
