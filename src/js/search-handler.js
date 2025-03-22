export default class SearchHandler {
    constructor(app) {
        this.app = app;
        this.initializeElements();
        this.setupEventListeners();
        // Remove the automatic search trigger from constructor
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
        const searchTerm = this.searchInput.value.trim();
        const currentLength = searchTerm.length;
        
        // In the validation checks:
        if (isManualTrigger && currentLength < 2) {
            this.app.renderEngine.showNoResults(true, currentLength, true);
        } else if (!isManualTrigger && currentLength > 0 && currentLength < 5) {
            this.app.renderEngine.showNoResults(true, currentLength, false);
        }
        const includeAuthor = this.authorCheckbox.checked;

        // Clear previous messages
        this.app.renderEngine.showMinCharsMessage(false);
        // Remove the line causing the error: this.app.renderEngine.showNoResults(false);

        if (isManualTrigger) {
            if (searchTerm.length < 2) {
                this.app.renderEngine.showMinCharsMessage(true);
                this.app.renderEngine.renderRecords([]);
                return;
            }
        } else {
            if (searchTerm.length > 0 && searchTerm.length < 5) {
                this.app.renderEngine.showMinCharsMessage(true);
                this.app.renderEngine.renderRecords([]);
                return;
            }
        }

        this.app.performSearch(searchTerm, includeAuthor);
    }
}