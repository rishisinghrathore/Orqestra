export const toCamelIdentifier = (value: string): string => {
  const parts = value
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
};

export const toSnakeIdentifier = (value: string): string => {
  const fromCamel = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return fromCamel;
};

export const toCustomTableName = (nameSingular: string): string => {
  const snake = toSnakeIdentifier(nameSingular);
  if (!snake) {
    throw new Error('Cannot derive table name from empty object name');
  }
  return `_${snake}`;
};
