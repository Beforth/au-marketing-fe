import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-[background-color,border-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-rose-600 text-white hover:bg-rose-700",
        danger: "bg-rose-600 text-white hover:bg-rose-700",
        outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
        secondary: "bg-slate-900 text-white hover:bg-slate-800",
        ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        link: "text-blue-600 hover:underline font-semibold p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 text-sm rounded-lg font-semibold",
        xxs: "h-7 px-2.5 text-[11px] rounded-md font-semibold",
        xs: "h-8 px-3 text-xs rounded-lg font-semibold",
        sm: "h-9 px-4 text-xs rounded-lg font-semibold",
        md: "h-10 px-5 text-sm rounded-lg font-semibold",
        lg: "h-12 px-8 text-base rounded-xl font-semibold",
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
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
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
