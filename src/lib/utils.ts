import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const usd = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits }).format(value);

export const signed = (value: number, digits = 2) => `${value >= 0 ? "+" : "-"}${usd(Math.abs(value), digits)}`;
