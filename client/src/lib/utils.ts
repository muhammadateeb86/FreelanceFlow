import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency (converts cents to dollars with proper formatting)
export function formatCurrency(amount: number): string {
  const dollars = amount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

// Format date to display format
export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC", // Ensure dates are displayed in UTC
  });
};

// Format date for input fields (YYYY-MM-DD)
export function formatDateForInput(
  date: string | Date | null | undefined,
): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) return "";

  return format(dateObj, "yyyy-MM-dd");
}

// Convert dollars to cents
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Convert cents to dollars
export function centsToDollars(cents: number): number {
  return cents / 100;
}

// Capitalize first letter of each word
export function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Format project status for display
export function formatProjectStatus(status: string): string {
  return status.split("_").map(capitalizeWords).join(" ");
}

// Format project type for display
export function formatProjectType(type: string): string {
  switch (type) {
    case "daily_rate":
      return "Daily Rate";
    case "fixed_price":
      return "Fixed Price";
    default:
      return capitalizeWords(type);
  }
}

// Generate random color (for charts, etc.)
export function getRandomColor(): string {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Get initials from a name (e.g., "John Doe" => "JD")
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Add days to a date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Check if a value is a valid number
export function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// Email validation regex
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Generate a unique ID (for temporary client-side use)
export function generateUniqueId(): string {
  return "id-" + Math.random().toString(36).substring(2, 9);
}
