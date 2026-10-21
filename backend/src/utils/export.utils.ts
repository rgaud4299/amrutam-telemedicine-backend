export interface ExportColumn<T = any> {
  header: string;
  key: string;
  transform?: (value: any, row: T) => any;
}

/**
 * Generates a CSV string from an array of records and custom column descriptions.
 * Supports nested field path resolution (e.g. 'owner.email') and format transforms.
 */
export function generateCSV<T = any>(data: T[], columns: ExportColumn<T>[]): string {
  // Create header row
  const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(",");

  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = getNestedValue(row, col.key);
      if (col.transform) {
        value = col.transform(value, row);
      }
      if (value === null || value === undefined) {
        value = "";
      } else if (value instanceof Date) {
        value = value.toISOString();
      }
      
      // Escape double quotes and surround field in double quotes
      const strVal = String(value).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(",");
  });

  return [headers, ...rows].join("\n");
}

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
