import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Responsive content width classes.
 * Mobile: 448px, md: 672px, lg: 896px, xl: 1024px
 */
export const CONTENT_WIDTH = "max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto";
