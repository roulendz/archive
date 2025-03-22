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
        
        console.log('SearchHandler.executeSearch:', {  // <-- Add this
            isManualTrigger,
            currentLength,
            searchTerm
        });

        // Update guidance system before any search execution
        this.app.renderEngine.updateSearchGuidance(currentLength, isManualTrigger);

        const includeAuthor = this.authorCheckbox.checked;

        // Clear static message if needed
        this.app.renderEngine.showMinCharsMessage(false);

        // Validate search requirements
        let validSearch = false;
        if (isManualTrigger) {
            validSearch = currentLength >= 2;
        } else {
            validSearch = currentLength >= 5;
        }

        // Execute search or pass null for invalid searches
        console.log('SearchHandler - validSearch:', validSearch);  // <-- Add this
        this.app.performSearch(validSearch ? searchTerm : null, includeAuthor);
    }
}