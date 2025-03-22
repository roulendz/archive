/**
 * Date formatting utilities for archive records
 * @module DateUtils
 */

/**
 * Formats date string into localized display components
 * @param {string} dateString - ISO 8601 date string
 * @returns {{
 *  formatted: string,
 *  dayName: string,
 *  year: number,
 *  month: string,
 *  day: string
 * }} Formatted date parts
 */
export function formatArchiveDate(dateString) {
    const date = new Date(dateString);
    
    /** @type {number} Full year (e.g. 1996) */
    const year = date.getFullYear();
    
    /** @type {string} Localized short month name */
    const month = date.toLocaleString('lv-LV', { month: 'short' });
    
    /** @type {string} Zero-padded day of month */
    const day = date.getDate().toString().padStart(2, '0');
    
    /** @type {string} Full weekday name in Latvian */
    const dayName = date.toLocaleDateString('lv-LV', { weekday: 'long' });

    return {
        formatted: `${year}-${month}-${day}`,
        dayName,
        year,
        month,
        day
    };
}

/**
 * Extracts year from date string for filtering
 * @param {string} dateString
 * @returns {number}
 */
export function getYearFromDate(dateString) {
    return new Date(dateString).getFullYear();
}