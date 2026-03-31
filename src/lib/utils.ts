import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert "14:30" → "2:30 PM" */
function fmt24to12(time: string): string {
  const [hStr, mStr] = time.trim().split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

/** Convert "09:00 - 17:00" → "9:00 AM - 5:00 PM" */
export function formatTimeSlot(slot: string): string {
  if (!slot) return slot;
  const parts = slot.split(' - ');
  if (parts.length !== 2) return slot;
  return `${fmt24to12(parts[0])} - ${fmt24to12(parts[1])}`;
}
