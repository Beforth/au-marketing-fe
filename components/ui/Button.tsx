import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-indigo-500/20",
        primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-indigo-500/20",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs",
        secondary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
        ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        link: "text-indigo-600 hover:underline font-semibold p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 text-sm rounded-lg font-bold",
        xxs: "h-7 px-2 text-[9px] rounded-md uppercase tracking-widest font-bold",
        xs: "h-8 px-3 text-[10px] rounded-lg uppercase tracking-widest font-bold",
        sm: "h-9 px-4 text-xs rounded-lg font-bold",
        md: "h-10 px-5 text-sm rounded-lg font-bold",
        lg: "h-12 px-8 text-base rounded-xl font-bold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin mr-2" size={16} />
        ) : (
          leftIcon && <span className="mr-2 opacity-90">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 opacity-90">{rightIcon}</span>}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
