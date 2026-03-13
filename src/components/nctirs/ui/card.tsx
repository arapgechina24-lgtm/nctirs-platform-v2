import { cn } from "@/lib/nctirs/utils"

type CardProps = React.ComponentPropsWithoutRef<'div'>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-none border border-green-900/50 bg-black backdrop-blur-sm shadow-2xl relative overflow-hidden",
        "before:absolute before:inset-0 before:border before:border-green-500/5 before:pointer-events-none",
        "card-shadow hover:border-green-500/30 transition-all duration-300",
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6 border-b border-slate-800/50 bg-slate-950/50", className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3
      className={cn("text-lg font-bold leading-none tracking-tight text-blue-50 uppercase", className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p
      className={cn("text-sm text-slate-400 font-medium", className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

export function CardFooter({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
}
