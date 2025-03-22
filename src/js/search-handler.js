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
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        const includeAuthor = this.authorCheckbox.checked;

        // Handle empty search for manual triggers
        if (isManualTrigger && !searchTerm) {
            this.app.renderEngine.renderRecords([]);
            return;
        }

        // Automatic search threshold
        if (!isManualTrigger && searchTerm.length < 5) {
            this.app.renderEngine.renderRecords([]);
            return;
        }

        this.app.performSearch(searchTerm, includeAuthor);
    }
}