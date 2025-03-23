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
     * @param {import('../../services/search-service.js').default} services.searchService
     */
    constructor(container, { eventService, searchService, dataService }) {  // Add dataService
        super(container);
        
        /** @type {import('../../services/event-service.js').default} */
        this.eventService = eventService;
        
        /** @type {import('../../services/search-service.js').default} */
        this.searchService = searchService;

        /** @type {import('../../services/data-service.js').default} */
        this.dataService = dataService;  // Add dataService reference

        /** @type {HTMLElement|null} */
        this.messageContainer = document.getElementById('messageContainer');
        
        /** @type {HTMLElement|null} */
        this.dynamicMessage = document.getElementById('dynamicMessage');
        
        /** @type {string} */
        this.currentSearchState = 'idle'; // 'idle', 'typing', 'searching', 'results', 'no-results'
        
        /**
         * Message templates for various states
         * @type {Object<string, string>}
         * @private
         */
        this._messages = {
            noResults: "Diemžēl nekas netika atrasts atbilstoši jūsu meklējumam.",
            minCharsDefault: "Automātiskai meklēšanai, lūdzu, ievadiet vismaz {untilAutoSearchIsEnabled} rakstzīmes!",
            placeholder: "Ievadiet meklēšanas kritērijus, lai atrastu ierakstus",
            searching: "Meklē...",
            resultsCount: (count, total) => `Atrast${count === 1 ? 's' : 'i'} ${count} no ${total} ierakst${total === 1 ? 'a' : 'iem'}`, 
            enterToSearch: "Nospiediet Enter vai klikšķiniet uz Meklēt, lai veiktu meklēšanu",
            typing: "Turpiniet rakstīt, lai meklētu..."
        };
        
        this.init();
    }
    
    /**
     * @override
     */
    init() {
        if (this.initialized) return;
        
        if (!this.messageContainer || !this.dynamicMessage) {
            console.error('SearchGuidance: Required message elements not found');
            return;
        }
        
        // Show the message container by default
        this.messageContainer.classList.remove('hidden');
        this.dynamicMessage.classList.remove('hidden');
        
        // Set default placeholder message
        const placeholder = document.getElementById('recordsPlaceholder');
        if (placeholder) {
            placeholder.textContent = this._messages.placeholder;
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
        this.eventService.subscribe('ui:updateGuidance', ({ message, currentLength, isManualSearch }) => {
            // Update internal search state
            this.currentSearchState = currentLength === 0 ? 'idle' : 'typing';
            
            if (currentLength === 0) {
                // Show initial guidance when no search term
                this.showMessage(this._messages.placeholder);
            } else {
                // Show dynamic message during typing
                if (message) {
                    this.showMessage(message);
                } else {
                    this.showMessage(this._messages.typing);
                }
            }
        });
        
        // When search begins
        this.eventService.subscribe('search:started', () => {
            this.currentSearchState = 'searching';
            this.showMessage(this._messages.searching);
        });
        
        // Handle search results
        this.eventService.subscribe('search:resultsReady', (results) => {
            const safeResults = Array.isArray(results) ? results : [];
            
            if (safeResults.length === 0 && this.currentSearchState === 'searching') {
                this.currentSearchState = 'no-results';
                this.showMessage(this._messages.noResults);
            } else if (safeResults.length > 0) {
                this.currentSearchState = 'results';
                const countMessage = this._messages.resultsCount(
                    safeResults.length,
                    this.dataService.getTotalRecords()  // Use direct reference
                );
                this.showMessage(countMessage);
            }
        });
        
        // Handle search invalidation with dynamic character counts
        this.eventService.subscribe('search:invalid', (searchOptions) => {
            if (!searchOptions || !searchOptions.searchTerm) return;
            
            // Get current input length
            const currentLength = searchOptions.searchTerm.length;
            
            // Get remaining character counts
            const remainingForAuto = this.searchService.autoSearchMinChars - currentLength;
            const remainingForManual = this.searchService.manualSearchMinChars - currentLength;
            
            // Create guidance message with dynamic character counts
            let guidanceMessage = this._messages.minCharsDefault
                .replace('{untilAutoSearchIsEnabled}', remainingForAuto)
                .replace('{untilManualSearchIsEnabled}', remainingForManual);
                
            // If manual search is possible but auto search isn't, add that info
            if (remainingForManual <= 0 && remainingForAuto > 0) {
                guidanceMessage += "\n" + this._messages.enterToSearch;
            }
            
            this.showMessage(guidanceMessage);
        });
    }
    
    /**
     * Show message in the dynamic message element
     * @param {string} message 
     * @returns {void}
     */
    showMessage(message) {
        if (!message) return;
        
        this.dynamicMessage.textContent = message;
        this.messageContainer.classList.remove('hidden');
        this.dynamicMessage.classList.remove('hidden');
    }
    
    /**
     * Update message templates programmatically
     * @param {Object<string, string>} messageUpdates
     * @returns {void}
     */
    updateMessages(messageUpdates) {
        Object.entries(messageUpdates).forEach(([key, value]) => {
            if (this._messages.hasOwnProperty(key)) {
                this._messages[key] = value;
            }
        });
    }
}