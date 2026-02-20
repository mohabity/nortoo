import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-mint text-midnight hover:bg-mint-dark shadow-sm",
        destructive: "bg-rose text-white hover:bg-rose/90 shadow-sm",
        outline: "border border-silk bg-white hover:bg-snow text-slate",
        secondary: "bg-snow text-slate hover:bg-silk",
        ghost: "hover:bg-snow text-slate",
        link: "text-ocean underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-sm",
        sm: "h-8 px-3 text-xs rounded-xs",
        lg: "h-10 px-6 rounded-sm",
        icon: "h-9 w-9 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
