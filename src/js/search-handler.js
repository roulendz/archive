export default class SearchHandler {
    constructor(app) {
        this.app = app;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.authorCheckbox = document.getElementById('authorCheckbox');
        this.searchButton = document.getElementById('searchButton');
    }

    setupEventListeners() {
        this.searchButton.addEventListener('click', () => this.executeSearch(true));
        this.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.executeSearch(true);
        });
        this.searchInput.addEventListener('input', () => this.executeSearch(false));
    }

    executeSearch(isManualTrigger) {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        const includeAuthor = this.authorCheckbox.checked;

        // For automatic searches, only search when 5+ characters
        if (!isManualTrigger && searchTerm.length < 5) {
            this.app.renderEngine.renderRecords([]);
            return;
        }

        this.app.performSearch(searchTerm, includeAuthor);
    }
}