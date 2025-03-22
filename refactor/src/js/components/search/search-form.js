// src/js/components/search/search-form.js

import BaseComponent from '../base-component.js';

/**
 * Search form component handling user input
 * @extends BaseComponent
 */
export default class SearchFormComponent extends BaseComponent {
    /**
     * @param {HTMLElement|string} container 
     * @param {Object} services - Application services
     * @param {import('../../services/event-service.js').default} services.eventService
     * @param {import('../../services/search-service.js').default} services.searchService
     */
    constructor(container, { eventService, searchService }) {
        super(container);
        
        /** @type {import('../../services/event-service.js').default} */
        this.eventService = eventService;
        
        /** @type {import('../../services/search-service.js').default} */
        this.searchService = searchService;
        
        // Verify the event service has the required methods
        if (!this.eventService || typeof this.eventService.subscribe !== 'function') {
            console.error('SearchFormComponent: Invalid event service - subscribe method not found');
            throw new Error('Invalid event service passed to SearchFormComponent');
        }
        
        /** @type {HTMLInputElement|null} */
        this.searchInput = null;
        
        /** @type {HTMLInputElement|null} */
        this.authorCheckbox = null;
        
        /** @type {HTMLButtonElement|null} */
        this.searchButton = null;
        
        /** @type {boolean} */
        this.isSearching = false;
        
        this.init();
    }
    
    /**
     * @override
     */
    init() {
        if (this.initialized) return;
        
        // Find elements
        this.searchInput = document.getElementById('searchInput');
        this.authorCheckbox = document.getElementById('authorCheckbox');
        this.searchButton = document.getElementById('searchButton');
        
        if (!this.searchInput || !this.authorCheckbox || !this.searchButton) {
            throw new Error('Required search form elements not found');
        }
        
        super.init();
    }
    
    /**
     * @override
     */
    bindEvents() {
        // Button click event
        this.searchButton.addEventListener('click', () => {
            this.executeSearch(true);
        });
        
        // Enter key event
        this.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.executeSearch(true);
            }
        });
        
        // Input change event (for auto-search)
        this.searchInput.addEventListener('input', () => {
            this.executeSearch(false);
        });
        
        // Subscribe to app events - add safety check
        if (this.eventService && typeof this.eventService.subscribe === 'function') {
            this.eventService.subscribe('app:ready', () => {
                this.searchInput.disabled = false;
                this.searchButton.disabled = false;
            });
        } else {
            console.warn('Unable to subscribe to app:ready event - invalid event service');
            // Fallback behavior - enable the form immediately
            this.searchInput.disabled = false;
            this.searchButton.disabled = false;
        }
    }
    
    /**
     * Process search input and dispatch search event
     * @param {boolean} isManualSearch - If triggered by button/enter
     * @returns {void}
     */
    executeSearch(isManualSearch) {
        // First check if event service is valid
        if (!this.eventService || typeof this.eventService.publish !== 'function') {
            console.error('Cannot execute search: Invalid event service');
            return;
        }
        
        const searchTerm = this.searchInput.value.trim();
        const currentLength = searchTerm.length;
        const includeAuthor = this.authorCheckbox.checked;
        
        // Get guidance message
        const message = this.searchService.getGuidanceMessage(
            currentLength, 
            isManualSearch
        );
        
        // Publish the guidance update
        this.eventService.publish('ui:updateGuidance', {
            currentLength,
            isManualSearch,
            message
        });
        
        // Hide min chars message when typing starts
        this.eventService.publish('ui:showMinCharsMessage', currentLength === 0);
        
        // Check if valid search
        const isValid = this.searchService.isValidSearch(
            searchTerm, 
            isManualSearch
        );
        
        // If it's a valid search, announce that we're starting the search
        if (isValid) {
            this.isSearching = true;
            this.eventService.publish('search:started', {
                searchTerm,
                includeAuthor,
                isManualSearch
            });
        }
        
        // Dispatch search event with validated term
        this.eventService.publish('search:requested', {
            searchTerm: isValid ? searchTerm : null,
            includeAuthor,
            isManualSearch
        });
        
        // If it's not a valid search but we have some text, publish an invalid search event
        if (!isValid && searchTerm) {
            this.eventService.publish('search:invalid', {
                searchTerm,
                includeAuthor,
                isManualSearch
            });
        }
    }
}