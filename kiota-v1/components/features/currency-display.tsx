/**
 * Currency Display Component
 * Shows amounts in both KES and USD with conversion
 */

import { formatKES, formatUSD, kesToUsd, usdToKes } from '@/lib/utils/currency';

interface CurrencyDisplayProps {
  amountUSD?: number;
  amountKES?: number;
  primaryCurrency?: 'KES' | 'USD';
  showBoth?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amountUSD,
  amountKES,
  primaryCurrency = 'USD',
  showBoth = true,
  className = '',
}: CurrencyDisplayProps) {
  // Calculate the other currency if not provided
  const usd = amountUSD ?? (amountKES ? kesToUsd(amountKES) : 0);
  const kes = amountKES ?? (amountUSD ? usdToKes(amountUSD) : 0);

  const primary = primaryCurrency === 'USD' ? formatUSD(usd) : formatKES(kes);
  const secondary = primaryCurrency === 'USD' ? formatKES(kes) : formatUSD(usd);

  return (
    <div className={className}>
      <div className="text-2xl font-bold">{primary}</div>
      {showBoth && (
        <div className="text-sm text-muted-foreground">≈ {secondary}</div>
      )}
    </div>
  );
}
