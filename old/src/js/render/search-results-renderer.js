import { formatArchiveDate } from '../utils/date-utils.js';

/** 
 * Handles search results rendering
 * @class
 */
export class SearchResultsRenderer {
    /**
     * @param {HTMLElement} recordsContainer 
     * @param {HTMLElement} noResultsMessage
     */
    constructor(recordsContainer, noResultsMessage) {
        /** @type {HTMLElement} */
        this.recordsContainer = recordsContainer;
        /** @type {HTMLElement} */
        this.noResultsMessage = noResultsMessage;
    }

    /**
     * Renders search results
     * @param {Array|null} records - Records to display
     */
    renderRecords(records) {
        this.recordsContainer.innerHTML = '';
        if (records === null) return;

        const hasResults = records.length > 0;
        this.noResultsMessage.classList.toggle('hidden', hasResults);

        if (!hasResults) {
            const defaultMsg = this.noResultsMessage.dataset.defaultMessage;
            this.noResultsMessage.querySelector('#dynamicMessage').textContent = defaultMsg;
            return;
        }

        records.forEach(record => this.createRecordCard(record));
    }

    /**
     * Creates individual record card
     * @param {Object} record - Record data
     */
    createRecordCard(record) {
        const card = document.createElement('div');
        card.className = `glassmorphism p-6 pastel-${(record.id % 5) + 1}`;
        card.innerHTML = this.getCardHTML(record);
        this.recordsContainer.appendChild(card);
    }

    /**
     * Generates card HTML content
     * @param {Object} record 
     * @returns {string} HTML string
     */
    getCardHTML(record) {
        return `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-semibold text-gray-800">${record.title}</h3>
            </div>
            <div class="text-sm text-gray-600">
                ${this.getDateHTML(record)}
                ${this.getAuthorHTML(record)}
            </div>
        `;
    }

    /**
     * Generates date HTML section using centralized date formatting
     * @param {Object} record 
     * @returns {string} HTML string
     */
    getDateHTML(record) {
        const { formatted, dayName } = formatArchiveDate(record.date?.toString() || new Date());
        return `
            <p class="mb-2 flex items-center gap-2">
                <i class="fas fa-calendar-day has-tooltip" data-tooltip="Date"></i>
                <span>${formatted}</span>
                <span class="text-xs text-gray-500">(${dayName})</span>
            </p>
        `;
    }

    /**
     * Generates author HTML section
     * @param {Object} record 
     * @returns {string} HTML string
     */
    getAuthorHTML(record) {
        return `
            <p class="flex items-center gap-2">
                <i class="fas fa-user has-tooltip" data-tooltip="Author"></i>
                ${record.author || 'Unknown'}
            </p>
        `;
    }
}