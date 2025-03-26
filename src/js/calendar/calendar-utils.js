// src/js/calendar/calendar-utils.js

/**
 * Utility functions for calendar component
 */

/**
 * Get the number of days in a month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Number of days in month
 */
export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week for the first day of a month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Day of week (0-6, where 0 is Monday and 6 is Sunday)
 */
export function getFirstDayOfMonth(year, month) {
    const day = new Date(year, month, 1).getDay();
    // Convert from Sunday-based (0-6) to Monday-based (0-6)
    return day === 0 ? 6 : day - 1;
}

/**
 * Format duration in seconds to minutes:seconds format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (MM:SS)
 */
export function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format time from date string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time (HH:MM)
 */
export function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Group events by date
 * @param {Array<import('../utils/types.js').ArchiveRecord>} records - Archive records
 * @returns {Object<string, Array<import('../utils/types.js').ArchiveRecord>>} Records grouped by date
 */
export function groupEventsByDate(records) {
    const grouped = {};
    
    records.forEach(record => {
        if (!record.date) return;
        
        // Get date part only (YYYY-MM-DD)
        const dateKey = record.date.toString().split('T')[0];
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        
        grouped[dateKey].push(record);
    });
    
    return grouped;
}

/**
 * Filter events by month and year
 * @param {Array<import('../utils/types.js').ArchiveRecord>} records - Archive records
 * @param {number} year - Year to filter by
 * @param {number} month - Month to filter by (0-11)
 * @returns {Array<import('../utils/types.js').ArchiveRecord>} Filtered records
 */
export function filterEventsByMonth(records, year, month) {
    return records.filter(record => {
        if (!record.date) return false;
        
        const date = new Date(record.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });
}