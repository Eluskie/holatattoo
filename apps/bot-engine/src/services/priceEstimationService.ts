/**
 * Price Estimation Service
 * Provides price range estimates based on collected data
 */

interface CollectedData {
  style?: string;
  placement_size?: string;
  color?: string;
  budget?: string;
  timing?: string;
  [key: string]: any;
}

interface PriceRange {
  min: number;
  max: number;
  currency: string;
  explanation: string;
}

/**
 * Calculate price range based on collected data
 */
export function calculatePriceRange(data: CollectedData): PriceRange {
  let baseMin = 80;
  let baseMax = 150;

  // Size multipliers (extracted from placement_size text)
  const sizeText = (data.placement_size || '').toLowerCase();
  if (sizeText.includes('xl') || sizeText.includes('mitja màniga') || sizeText.includes('manga')) {
    baseMin *= 4;
    baseMax *= 5;
  } else if (sizeText.includes('l') || sizeText.includes('gran')) {
    baseMin *= 2.5;
    baseMax *= 3;
  } else if (sizeText.includes('m') || sizeText.includes('mitjà')) {
    baseMin *= 1.5;
    baseMax *= 2;
  }
  // S (petit) keeps base price

  // Style adjustments
  const style = (data.style || '').toLowerCase();
  if (style.includes('realisme') || style.includes('realism')) {
    baseMin *= 1.3;
    baseMax *= 1.4;
  } else if (style.includes('aquarel') || style.includes('watercolor')) {
    baseMin *= 1.2;
    baseMax *= 1.3;
  }

  // Color adds cost
  const color = (data.color || '').toLowerCase();
  if (color.includes('color') && !color.includes('blanc')) {
    baseMin *= 1.2;
    baseMax *= 1.3;
  }

  // Rush timing adds premium
  const timing = (data.timing || '').toLowerCase();
  if (timing.includes('urgent') || timing.includes('demà')) {
    baseMin *= 1.15;
    baseMax *= 1.2;
  }

  // Round to nearest 10
  const min = Math.round(baseMin / 10) * 10;
  const max = Math.round(baseMax / 10) * 10;

  // Generate explanation
  const factors = [];
  if (sizeText.includes('xl')) factors.push('mida XL');
  else if (sizeText.includes('l')) factors.push('mida gran');
  else if (sizeText.includes('m')) factors.push('mida mitjana');

  if (style.includes('realisme')) factors.push('estil realisme');
  if (color.includes('color') && !color.includes('blanc')) factors.push('a color');
  if (timing.includes('urgent')) factors.push('urgent');

  const explanation = factors.length > 0
    ? `basat en: ${factors.join(', ')}`
    : 'basat en la informació proporcionada';

  return {
    min,
    max,
    currency: '€',
    explanation
  };
}

/**
 * Format price range as readable text
 */
export function formatPriceRange(priceRange: PriceRange): string {
  return `El preu aproximat seria entre ${priceRange.min}${priceRange.currency} i ${priceRange.max}${priceRange.currency} (${priceRange.explanation}). El preu final el donarà l'artista després de revisar el disseny.`;
}

/**
 * Check if collected data has enough info for price estimate
 */
export function hasEnoughDataForEstimate(data: CollectedData): boolean {
  return !!(data.style && data.placement_size);
}

/**
 * Estimate price with minimal interface (returns only min/max)
 * Used for passing to bot system prompt
 */
export function estimatePrice(data: CollectedData): { min: number; max: number } {
  const priceRange = calculatePriceRange(data);
  return { min: priceRange.min, max: priceRange.max };
}
