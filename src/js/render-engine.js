export default class RenderEngine {
    constructor() {
        this.recordsContainer = document.getElementById('recordsContainer');
        this.noResultsMessage = document.getElementById('noResultsMessage');
    }

    // Add date formatting function at top of class
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate().toString().padStart(2, '0');
        const dayName = date.toLocaleDateString('lv-LV', { weekday: 'long' });
        return { formatted: `${year}-${month}-${day}`, dayName };
    };

    // In renderRecords method update the date line
    renderRecords(records) {
        this.recordsContainer.innerHTML = '';
        this.noResultsMessage.classList.toggle('hidden', records.length > 0);

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
}