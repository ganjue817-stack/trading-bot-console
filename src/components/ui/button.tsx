import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "danger" | "success"; size?: "sm" | "md" | "icon" };

export const Button = forwardRef<HTMLButtonElement, Props>(({ className, variant = "default", size = "md", ...props }, ref) => (
  <button ref={ref} className={cn(
    "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "h-10 px-3 text-xs", size === "md" && "h-10 px-3.5 text-sm", size === "icon" && "h-10 w-10 p-0",
    variant === "default" && "border-[#d2b46b] bg-[#d2b46b] text-[#17120a] hover:bg-[#e5c97d]",
    variant === "outline" && "border-[#354252] bg-[#121923] text-[#dce3ec] hover:border-[#53677c] hover:bg-[#192330]",
    variant === "ghost" && "border-transparent bg-transparent text-[#9aa7b7] hover:bg-[#18212c] hover:text-[#f2eadc]",
    variant === "danger" && "border-[#7e3d43] bg-[#3a1e24] text-[#ffb9bc] hover:bg-[#51272f]",
    variant === "success" && "border-[#2e735f] bg-[#16372e] text-[#a8efd0] hover:bg-[#1c4c3e]", className,
  )} {...props} />
));
Button.displayName = "Button";
