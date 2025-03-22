export default class RenderEngine {
    constructor() {
        this.recordsContainer = document.getElementById('recordsContainer');
        this.noResultsMessage = document.getElementById('noResultsMessage');
    }

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
                    <p class="mb-2">Date: ${new Date(record.date).toLocaleDateString()}</p>
                    <p>Author: ${record.author}</p>
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