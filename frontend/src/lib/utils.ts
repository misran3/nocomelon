import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Responsive content width classes.
 * Mobile: 448px, sm: 512px, md: 576px, lg: 672px
 */
export const CONTENT_WIDTH = "max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto";
