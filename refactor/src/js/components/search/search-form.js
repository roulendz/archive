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
        
        /** @type {HTMLInputElement|null} */
        this.searchInput = null;
        
        /** @type {HTMLInputElement|null} */
        this.authorCheckbox = null;
        
        /** @type {HTMLButtonElement|null} */
        this.searchButton = null;
        
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
        
        // Subscribe to app events
        this.eventService.subscribe('app:ready', () => {
        this.searchInput.disabled = false;
        this.searchButton.disabled = false;
        });
    }
    
    /**
     * Process search input and dispatch search event
     * @param {boolean} isManualSearch - If triggered by button/enter
     * @returns {void}
     */
    executeSearch(isManualSearch) {
        const searchTerm = this.searchInput.value.trim();
        const currentLength = searchTerm.length;
        const includeAuthor = this.authorCheckbox.checked;
        
        // Update guidance UI
        const message = this.searchService.getGuidanceMessage(
        currentLength, 
        isManualSearch
        );
        
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
        
        // Dispatch search event
        this.eventService.publish('search:requested', {
        searchTerm: isValid ? searchTerm : null,
        includeAuthor,
        isManualSearch
        });
    }
}