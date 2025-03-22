// src/js/components/search/search-guidance.js

import BaseComponent from '../base-component.js';

/**
 * Component for displaying search guidance messages
 * @extends BaseComponent
 */
export default class SearchGuidanceComponent extends BaseComponent {
    /**
     * @param {HTMLElement|string} container 
     * @param {Object} services
     * @param {import('../../services/event-service.js').default} services.eventService
     */
    constructor(container, { eventService }) {
        super(container);
        
        /** @type {import('../../services/event-service.js').default} */
        this.eventService = eventService;
        
        /** @type {HTMLElement|null} */
        this.minCharsMessage = document.getElementById('minCharsMessage');
        
        /** @type {HTMLElement|null} */
        this.noResultsMessage = document.getElementById('noResultsMessage');
        
        /** @type {HTMLElement|null} */
        this.dynamicMessage = document.getElementById('dynamicMessage');
        
        /** @type {HTMLElement|null} */
        this.defaultMessage = document.getElementById('defaultMessage');
        
        this.init();
    }
    
    /**
     * @override
     */
    init() {
        if (this.initialized) return;
        
        if (!this.minCharsMessage || !this.noResultsMessage || 
            !this.dynamicMessage || !this.defaultMessage) {
        console.error('SearchGuidance: Required message elements not found');
        return;
        }
        
        this.setupEventSubscriptions();
        super.init();
    }
    
    /**
     * Setup event subscriptions for guidance updates
     * @returns {void}
     */
    setupEventSubscriptions() {
        // When search guidance should be updated
        this.eventService.subscribe('ui:updateGuidance', ({ message, currentLength }) => {
        console.log('Guidance update:', message);
        
        // Hide min chars message when typing has started
        this.showMinCharsMessage(currentLength === 0);
        
        // Show dynamic message if we have one
        if (message) {
            this.showDynamicMessage(message);
        } else {
            this.hideNoResults();
        }
        });
        
        // Handle min chars message visibility
        this.eventService.subscribe('ui:showMinCharsMessage', (show) => {
        this.showMinCharsMessage(show);
        });
        
        // Handle no results message
        this.eventService.subscribe('search:resultsReady', (results) => {
        if (results && results.length === 0) {
            // Show default no results message
            this.showDefaultNoResults();
        } else {
            this.hideNoResults();
        }
        });
    }
    
    /**
     * Show minimum characters message
     * @param {boolean} show 
     * @returns {void}
     */
    showMinCharsMessage(show) {
        this.minCharsMessage.classList.toggle('hidden', !show);
    }
    
    /**
     * Show no results with dynamic message
     * @param {string} message 
     * @returns {void}
     */
    showDynamicMessage(message) {
        if (!message) return;
        
        this.dynamicMessage.textContent = message;
        this.dynamicMessage.classList.remove('hidden');
        this.defaultMessage.classList.add('hidden');
        this.noResultsMessage.classList.remove('hidden');
    }
    
    /**
     * Show default no results message
     * @returns {void}
     */
    showDefaultNoResults() {
        this.defaultMessage.classList.remove('hidden');
        this.dynamicMessage.classList.add('hidden');
        this.noResultsMessage.classList.remove('hidden');
    }
    
    /**
     * Hide no results message
     * @returns {void}
     */
    hideNoResults() {
        this.noResultsMessage.classList.add('hidden');
    }
}