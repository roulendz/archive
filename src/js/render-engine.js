export default class RenderEngine {
    constructor() {
        this.recordsContainer = document.getElementById('recordsContainer');
        this.noResultsMessage = document.getElementById('noResultsMessage');
        this.minCharsMessage = document.getElementById('minCharsMessage');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate().toString().padStart(2, '0');
        const dayName = date.toLocaleDateString('lv-LV', { weekday: 'long' });
        return { formatted: `${year}-${month}-${day}`, dayName };
    };

    /**
     * Handles search guidance messages based on input state
     * @param {number} currentLength - Current search input length
     * @param {boolean} isManualTrigger - Whether search was manually triggered
     */
    updateSearchGuidance(currentLength, isManualTrigger) {
        const AUTO_SEARCH_MIN = 5;
        const MANUAL_SEARCH_MIN = 2;

        if (currentLength === 0) {
            this.showMinCharsMessage(true);
            this.showNoResults(false);
            return;
        }

        this.showMinCharsMessage(false);

        // Always calculate remaining characters
        const remainingAuto = Math.max(AUTO_SEARCH_MIN - currentLength, 0);
        const remainingManual = Math.max(MANUAL_SEARCH_MIN - currentLength, 0);

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

        console.log('RenderEngine.updateSearchGuidance:', message);  // <-- Add this
        this.showNoResults(true, message);
    }

    renderRecords(records) {
        console.log('RenderEngine.renderRecords:', {
            input: records,
        });

        this.recordsContainer.innerHTML = '';
        this.minCharsMessage.classList.add('hidden');

        if (records === null) {
            console.log('RenderEngine - Preserving guidance messages');
            return;
        }

        // Existing results handling
        const hasResults = records.length > 0;
        this.noResultsMessage.classList.toggle('hidden', hasResults);

        if (records.length === 0) {
            console.log('RenderEngine - Showing default no results message');
            const defaultMsg = this.noResultsMessage.dataset.defaultMessage;
            this.showNoResults(true, defaultMsg);
        }

        // Add missing record rendering logic
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

    showMinCharsMessage(show) {
        this.minCharsMessage.classList.toggle('hidden', !show);
    }

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