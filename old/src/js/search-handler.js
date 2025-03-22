/** @typedef {{ renderEngine: { updateSearchGuidance: Function, showMinCharsMessage: Function }, performSearch: Function }} AppType */

/**
 * Controller for search operations handling UI interactions and validation
 * @class
 * @property {AppType} app - Main application instance
 * @property {HTMLInputElement|null} searchInput - Search text input
 * @property {HTMLInputElement|null} authorCheckbox - Author filter toggle
 * @property {HTMLButtonElement|null} searchButton - Manual search trigger
 */
export default class SearchHandler {
    /**
     * Creates search controller instance
     * @param {AppType} app - Parent application containing renderEngine and performSearch
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

    /** 
     * Cache DOM references for search interface elements
     * @throws {Error} If required elements are missing
     */
    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.authorCheckbox = document.getElementById('authorCheckbox');
        this.searchButton = document.getElementById('searchButton');
    }

    /**
     * Handle search trigger events:
     * - Manual: Button click/Enter key (2+ chars)
     * - Auto: Input changes (5+ chars)
     */
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
     * Execute search with validation logic
     * @param {boolean} isManualTrigger - True for explicit user actions
     * @description Handles:
     * - Search term sanitization
     * - UI guidance updates
     * - Validation thresholds
     * - Search execution delegation
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