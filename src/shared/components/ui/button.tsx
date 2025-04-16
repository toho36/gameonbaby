import { cn } from "~/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "link"
    | "outline"
    | "edit"
    | "delete"
    | "duplicate"
    | "add";
  size?: "default" | "sm" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "focus-visible:ring-ring ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" &&
            "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2",
          variant === "outline" &&
            "border-input hover:bg-accent hover:text-accent-foreground h-10 border px-4 py-2",
          variant === "link" &&
            "text-primary underline-offset-4 hover:underline",
          variant === "edit" &&
            "h-10 bg-blue-600 px-4 py-2 text-white hover:bg-blue-700",
          variant === "delete" &&
            "h-10 bg-red-600 px-4 py-2 text-white hover:bg-red-700",
          variant === "duplicate" &&
            "h-10 bg-purple-600 px-4 py-2 text-white hover:bg-purple-700",
          variant === "add" &&
            "flex h-10 items-center gap-2 bg-green-600 px-5 py-2 font-semibold text-white shadow-md hover:bg-green-700",
          size === "sm" && "h-8 px-3 py-1 text-xs",
          size === "lg" && "h-12 px-6 py-3 text-base",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
