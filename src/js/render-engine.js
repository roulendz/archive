/** 
 * UI rendering controller for search results and guidance messages
 * @class
 * @property {HTMLElement} recordsContainer - Main container for search results
 * @property {HTMLElement} noResultsMessage - Element for displaying no-results messages
 * @property {HTMLElement} minCharsMessage - Element for minimum character warnings
 */
export default class RenderEngine {
    /**
     * Initializes DOM references for UI elements
     * @throws {ReferenceError} If required DOM elements are missing
     */
    constructor() {
        this.recordsContainer = document.getElementById('recordsContainer');
        this.noResultsMessage = document.getElementById('noResultsMessage');
        this.minCharsMessage = document.getElementById('minCharsMessage');
    }

    /**
     * Formats date string into localized display format
     * @param {string} dateString - ISO 8601 date string
     * @returns {{formatted: string, dayName: string}} Object containing formatted date parts
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate().toString().padStart(2, '0');
        const dayName = date.toLocaleDateString('lv-LV', { weekday: 'long' });
        return { formatted: `${year}-${month}-${day}`, dayName };
    };

    /**
     * Updates search interface guidance messages
     * @param {number} currentLength - Current length of search input
     * @param {boolean} isManualTrigger - Whether triggered by explicit user action
     * @description Manages:
     * - Minimum character warnings
     * - Search state messaging
     * - Manual vs automatic trigger differences
     */
    updateSearchGuidance(currentLength, isManualTrigger) {
        /** @type {number} Search thresholds prevent excessive API calls */
        const AUTO_SEARCH_MIN = 5;
        const MANUAL_SEARCH_MIN = 2;

        if (currentLength === 0) {
            this.showMinCharsMessage(true);
            this.showNoResults(false);
            return;
        }

        this.showMinCharsMessage(false);

        // Calculate remaining characters needed for valid searches
        /** @type {number} Characters needed for auto-search */
        const remainingAuto = Math.max(AUTO_SEARCH_MIN - currentLength, 0);
        /** @type {number} Characters needed for manual search */
        const remainingManual = Math.max(MANUAL_SEARCH_MIN - currentLength, 0);

        /** @type {string} Contextual guidance message */
        let message = '';
        if (isManualTrigger) {
            message = remainingManual > 0 
                ? `Please enter ${remainingManual} more character${remainingManual !== 1 ? 's' : ''} to search`
                : 'Showing manual search results';
        } else {
            if (remainingAuto > 0) {
                message = `Please enter ${remainingAuto} more character${remainingAuto !== 1 ? 's' : ''} for auto-search`;
                if (currentLength >= MANUAL_SEARCH_MIN) {
                    message += ' or click Search';
                }
            } else {
                message = 'Showing automatic search results';
            }
        }

        console.log('RenderEngine.updateSearchGuidance:', message);
        this.showNoResults(true, message);
    }

    /**
     * Renders search results with error handling
     * @param {Array|null} records - Search results (null preserves existing messages)
     * @description Handles:
     * - Clearing previous results
     * - Null state preservation
     * - Empty results handling
     * - Dynamic card generation
     */
    renderRecords(records) {
        console.log('RenderEngine.renderRecords:', {
            input: records,
        });

        this.recordsContainer.innerHTML = '';
        this.minCharsMessage.classList.add('hidden');

        // Null state preserves current guidance messages
        if (records === null) {
            console.log('RenderEngine - Preserving guidance messages');
            return;
        }

        /** @type {boolean} Results availability state */
        const hasResults = records.length > 0;
        this.noResultsMessage.classList.toggle('hidden', hasResults);

        // Handle empty results with default message
        if (records.length === 0) {
            console.log('RenderEngine - Showing default no results message');
            const defaultMsg = this.noResultsMessage.dataset.defaultMessage;
            this.showNoResults(true, defaultMsg);
        }

        // Generate result cards with dynamic styling
        records.forEach(record => {
            const card = document.createElement('div');
            card.className = 'glassmorphism p-6 pastel-' + ((record.id % 5) + 1);
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">${record.title}</h3>
                </div>
                <div class="text-sm text-gray-600">
                    <p class="mb-2 flex items-center gap-2">
                        <i class="fas fa-calendar-day has-tooltip" data-tooltip="Date"></i>
                        <span>${this.formatDate(record.date?.toString() || new Date()).formatted}</span>
                        <span class="text-xs text-gray-500">(${this.formatDate(record.date?.toString() || new Date()).dayName})</span>
                    </p>
                    <p class="flex items-center gap-2">
                        <i class="fas fa-user has-tooltip" data-tooltip="Author"></i>
                        ${record.author || 'Unknown'}
                    </p>
                </div>
            `;
            this.recordsContainer.appendChild(card);
        });
    }

    /**
     * Toggles minimum character warning visibility
     * @param {boolean} show - Visibility state
     */
    showMinCharsMessage(show) {
        this.minCharsMessage.classList.toggle('hidden', !show);
    }

    /**
     * Controls display of no-results message
     * @param {boolean} show - Whether to display the message
     * @param {string} [customMessage=''] - Context-specific message content
     */
    showNoResults(show, customMessage = '') {
        const container = this.noResultsMessage;
        const dynamicMsg = container.querySelector('#dynamicMessage');
        
        if (show) {
            dynamicMsg.textContent = customMessage;
            container.classList.add('show-dynamic');
        } else {
            container.classList.remove('show-dynamic');
            dynamicMsg.textContent = '';
        }
        
        container.classList.toggle('hidden', !show);
    }
}