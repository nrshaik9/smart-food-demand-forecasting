/**
 * Date formatting utility for consistent "Mon DD, YYYY" format across the entire application.
 * Example outputs: "Jan 01, 2024", "Sep 19, 2026"
 */
export function formatDateDisplay(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '—';

  // If dateInput is a Date object
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '—';
    return dateInput.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }

  const str = String(dateInput).trim();
  if (!str) return '—';

  // Try standard parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }

  // Handle formats like "D/M/YYYY" or "M/D/YYYY" or "YYYY-MM-DD"
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    let year: number;
    let month: number;
    let day: number;

    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // M/D/YYYY or D/M/YYYY
      year = parseInt(parts[2], 10);
      month = parseInt(parts[0], 10) - 1;
      day = parseInt(parts[1], 10);
    } else {
      year = 2000 + parseInt(parts[2], 10);
      month = parseInt(parts[0], 10) - 1;
      day = parseInt(parts[1], 10);
    }

    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    }
  }

  return str;
}

/**
 * Standardizes a date string to a sortable ISO YYYY-MM-DD string
 */
export function normalizeDateKey(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const parts = String(dateStr).trim().split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}
