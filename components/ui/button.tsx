import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-orange-600 text-white hover:bg-orange-700",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-orange-300 dark:border-orange-500/40 bg-white dark:bg-transparent text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-300",
        secondary:
          "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-white/15",
        ghost: "hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white text-gray-700 dark:text-gray-300",
        link: "text-orange-600 dark:text-orange-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }