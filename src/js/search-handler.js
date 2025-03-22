/** @typedef {{ renderEngine: { updateSearchGuidance: Function, showMinCharsMessage: Function }, performSearch: Function }} AppType */

/**
 * Controller class for handling search operations and UI interactions
 * @class
 */
export default class SearchHandler {
    /**
     * @param {AppType} app - Main application instance with required dependencies
     */
    constructor(app) {
        /** @type {AppType} */
        this.app = app;
        /** @type {HTMLInputElement|null} */
        this.searchInput = null;
        /** @type {HTMLInputElement|null} */
        this.authorCheckbox = null;
        /** @type {HTMLButtonElement|null} */
        this.searchButton = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    /** Initializes DOM element references */
    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.authorCheckbox = document.getElementById('authorCheckbox');
        this.searchButton = document.getElementById('searchButton');
    }

    /** Sets up event listeners for search interactions */
    setupEventListeners() {
        // Manual search triggers
        this.searchButton.addEventListener('click', () => this.executeSearch(true));
        this.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.executeSearch(true);
        });
        
        // Automatic input handling
        this.searchInput.addEventListener('input', () => this.executeSearch(false));
    }

    /**
     * Main search execution logic
     * @param {boolean} isManualTrigger - Whether the search was triggered explicitly by user action
     */
    executeSearch(isManualTrigger) {
        const searchTerm = this.searchInput.value.trim();
        const currentLength = searchTerm.length;
        
        console.log('SearchHandler.executeSearch:', {
            isManualTrigger,
            currentLength,
            searchTerm
        });

        // Update search guidance UI state
        this.app.renderEngine.updateSearchGuidance(currentLength, isManualTrigger);

        /** @type {boolean} */
        const includeAuthor = this.authorCheckbox.checked;

        this.app.renderEngine.showMinCharsMessage(false);

        // Determine search validity based on trigger type and length
        /** @type {boolean} */
        let validSearch = false;
        if (isManualTrigger) {
            // Allow shorter queries for explicit searches
            validSearch = currentLength >= 2;
        } else {
            // Require longer input for automatic searches
            validSearch = currentLength >= 5;
        }

        console.log('SearchHandler - validSearch:', validSearch);
        this.app.performSearch(validSearch ? searchTerm : null, includeAuthor);
    }
}