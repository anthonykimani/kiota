/**
 * Asset Badge Component
 * Displays asset type with appropriate color coding
 */

import { Badge } from '@/components/ui/badge';
import { AssetType } from '@/types/models/portfolio';

interface AssetBadgeProps {
  asset: AssetType;
  className?: string;
}

const assetConfig = {
  [AssetType.USDM]: {
    label: 'USDM',
    variant: 'default' as const,
    emoji: '🛡️',
    description: 'Preservation',
  },
  [AssetType.USDY]: {
    label: 'USDY',
    variant: 'default' as const,
    emoji: '🛡️',
    description: 'Preservation',
  },
  [AssetType.BCSPX]: {
    label: 'bCSPX',
    variant: 'secondary' as const,
    emoji: '📈',
    description: 'Growth',
  },
  [AssetType.PAXG]: {
    label: 'PAXG',
    variant: 'outline' as const,
    emoji: '🥇',
    description: 'Hedge',
  },
  [AssetType.BTC]: {
    label: 'BTC',
    variant: 'destructive' as const,
    emoji: '₿',
    description: 'Speculative',
  },
  [AssetType.ETH]: {
    label: 'ETH',
    variant: 'destructive' as const,
    emoji: '◆',
    description: 'Speculative',
  },
  [AssetType.OUSG]: {
    label: 'OUSG',
    variant: 'default' as const,
    emoji: '🏛️',
    description: 'Preservation',
  },
};

export function AssetBadge({ asset, className }: AssetBadgeProps) {
  const config = assetConfig[asset];

  return (
    <Badge variant={config.variant} className={className}>
      <span className="mr-1">{config.emoji}</span>
      {config.label}
    </Badge>
  );
}

export function AssetLabel({ asset }: { asset: AssetType }) {
  const config = assetConfig[asset];
  return (
    <span className="inline-flex items-center gap-1">
      <span>{config.emoji}</span>
      <span className="font-medium">{config.label}</span>
      <span className="text-xs text-muted-foreground">({config.description})</span>
    </span>
  );
}
