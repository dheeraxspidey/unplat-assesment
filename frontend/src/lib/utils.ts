import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatEventDateTime(start: string | Date, end?: string | Date): string {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null

    const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    }
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit', minute: '2-digit'
    }

    const startDay = startDate.toLocaleDateString(undefined, dateOptions)
    const startTime = startDate.toLocaleTimeString(undefined, timeOptions)

    if (!endDate) {
        return `${startDay} • ${startTime}`
    }

    const endDay = endDate.toLocaleDateString(undefined, dateOptions)
    const endTime = endDate.toLocaleTimeString(undefined, timeOptions)

    if (startDay === endDay) {
        return `${startDay} • ${startTime} - ${endTime}`
    } else {
        return `${startDay}, ${startTime} - ${endDay}, ${endTime}`
    }
}
