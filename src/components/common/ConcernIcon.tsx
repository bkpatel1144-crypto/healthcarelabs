import {
  Activity,
  Baby,
  Bone,
  Droplet,
  Filter,
  Flower2,
  HeartPulse,
  Layers,
  ScanSearch,
  ShieldCheck,
  Sun,
  User,
  type LucideIcon,
} from 'lucide-react';

/**
 * Explicit icon registry. Concern data stores an icon *name*, and this maps it
 * to a component — which keeps the data files free of JSX and lets the whole
 * of lucide-react tree-shake down to just these twelve glyphs.
 */
const REGISTRY: Record<string, LucideIcon> = {
  Activity,
  Baby,
  Bone,
  Droplet,
  Filter,
  Flower2,
  HeartPulse,
  Layers,
  ScanSearch,
  ShieldCheck,
  Sun,
  User,
};

export function ConcernIcon({
  name,
  className,
  strokeWidth = 1.9,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = REGISTRY[name] ?? Activity;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
