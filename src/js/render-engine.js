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

    showMinCharsMessage(show) {
        this.minCharsMessage.classList.toggle('hidden', !show);
        if (show) {
            this.noResultsMessage.classList.add('hidden');
        }
    }

    renderRecords(records) {
        this.recordsContainer.innerHTML = '';
        this.noResultsMessage.classList.toggle('hidden', records.length > 0);
        this.minCharsMessage.classList.add('hidden');

        // Add this conditional to handle empty results after valid search
        if (records.length === 0) {
            this.showNoResults(true, 0, true); // Force default message
        }

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

    showLoading(isLoading) {
        const loader = document.getElementById('loadingIndicator');
        loader.classList.toggle('hidden', !isLoading);
    }

    showNoResults(show, currentLength = 0, isManualTrigger = false) {
        const container = this.noResultsMessage;
        const dynamicMsg = container.querySelector('#dynamicMessage');

        // Modified condition to hide dynamic messages on valid searches
        if (show && currentLength > 0 && (currentLength < 5 && !isManualTrigger)) {
            const needsAutoGuidance = !isManualTrigger && currentLength < 5;
            const needsManualGuidance = isManualTrigger && currentLength < 2;
            
            if (needsAutoGuidance || needsManualGuidance) {
                const charsNeededAuto = Math.max(5 - currentLength, 0);
                const charsNeededManual = Math.max(2 - currentLength, 0);
                
                let message = '';
                if (!isManualTrigger && currentLength < 5) {
                    message = `Enter ${charsNeededAuto} more character${charsNeededAuto !== 1 ? 's' : ''} for auto-search`;
                    if (currentLength >= 2) {
                        message += ' or click Search';
                    }
                } else if (isManualTrigger && currentLength < 2) {
                    message = `Enter ${charsNeededManual} more character${charsNeededManual !== 1 ? 's' : ''} to search`;
                }
                
                dynamicMsg.textContent = message;
                container.classList.add('show-dynamic');
            } else {
                // Clear dynamic message when thresholds are met
                container.classList.remove('show-dynamic');
                dynamicMsg.textContent = '';
            }
        } else {
            container.classList.remove('show-dynamic');
            dynamicMsg.textContent = '';
        }

        container.classList.toggle('hidden', !show);
    }
}