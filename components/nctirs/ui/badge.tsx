import { cn } from "@/lib/nctirs/utils"
import { type ThreatLevel, type IncidentStatus } from "@/lib/nctirs/mockData"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: 'bg-black text-green-500 border border-green-900',
  critical: 'bg-red-950/30 text-red-500 border border-red-900 animate-pulse shadow-lg shadow-red-900/20',
  high: 'bg-orange-950/30 text-orange-500 border border-orange-900',
  medium: 'bg-yellow-950/30 text-yellow-500 border border-yellow-900',
  low: 'bg-green-900/20 text-green-400 border border-green-800',
  success: 'bg-green-900/40 text-green-300 border border-green-600',
  warning: 'bg-yellow-900/20 text-yellow-400 border border-yellow-800',
  info: 'bg-green-900/10 text-green-500 border border-green-900',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export function ThreatBadge({ level }: { level: ThreatLevel }) {
  const variantMap: Record<ThreatLevel, BadgeProps['variant']> = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  }

  return <Badge variant={variantMap[level]}>{level}</Badge>
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const variantMap: Record<IncidentStatus, BadgeProps['variant']> = {
    ACTIVE: 'critical',
    INVESTIGATING: 'warning',
    RESOLVED: 'success',
    MONITORING: 'info',
  }

  return <Badge variant={variantMap[status]}>{status}</Badge>
}
