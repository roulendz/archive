// src/js/calendar/event-details.js

import { formatArchiveDate } from '../utils/date-utils.js';
import { formatDuration } from './calendar-utils.js';
import { escapeHtml } from '../utils/dom-utils.js';

/**
 * Build the detail markup shown when a recording is opened from a calendar.
 * Shared by the month and multi-month views, which previously carried
 * byte-identical copies of this and drifted apart on every fix.
 *
 * Rows with nothing to say are dropped rather than printed as "Unknown", and
 * the file's location on disk is deliberately not shown - it is operational
 * metadata that a visitor cannot act on.
 *
 * @param {import('../utils/types.js').ArchiveRecord} event
 * @returns {string} HTML for the modal body
 */
export function renderEventDetails(event) {
    const dateObj = new Date(event.date);
    const formattedDate = formatArchiveDate(event.date);

    // Pre-2010 records store a date with no real recording time. Rendering
    // "00:00" would invent precision the archive does not have.
    const hasTime = !Number.isNaN(dateObj.getTime()) &&
        (dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0);
    const timeString = hasTime
        ? `${dateObj.getHours().toString().padStart(2, '0')}:` +
          `${dateObj.getMinutes().toString().padStart(2, '0')}`
        : null;

    // Records with no linked file have no duration; unguarded arithmetic
    // rendered "NaN:NaN".
    const durationString = Number.isFinite(event.duration) && event.duration > 0
        ? formatDuration(event.duration)
        : null;

    const rows = [
        ['Datums', formattedDate ? `${formattedDate.formatted} (${formattedDate.dayName})` : null],
        ['Laiks', timeString],
        ['Ilgums', durationString],
        ['Autors', event.author],
        ['Formāts', event.fileType],
        ['Sērija', event.series || event.group]
    ].filter(([, value]) => value);

    // Titles and authors are transcribed filenames, not trusted markup.
    return `
        <div class="grid grid-cols-3 gap-2 text-sm">
            ${rows.map(([label, value]) => `
            <div class="font-semibold">${escapeHtml(label)}:</div>
            <div class="col-span-2">${escapeHtml(value)}</div>`).join('')}
        </div>
    `;
}
