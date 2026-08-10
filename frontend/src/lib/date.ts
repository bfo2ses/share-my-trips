export function formatDateOnly(value: string, options: Intl.DateTimeFormatOptions = {}): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'UTC' }).format(date);
}
