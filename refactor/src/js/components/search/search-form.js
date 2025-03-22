// src/js/components/search/search-form.js

import BaseComponent from '../base-component.js';
import { debug } from '../../utils/debugservice-utils.js';

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
        debug.log('Initializing SearchFormComponent');
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
        if (this.initialized) {
            debug.log('SearchFormComponent already initialized, skipping');
            return;
        }
        
        debug.group('Initializing SearchFormComponent', () => {
            // Find elements
            this.searchInput = document.getElementById('searchInput');
            this.authorCheckbox = document.getElementById('authorCheckbox');
            this.searchButton = document.getElementById('searchButton');
            
            // Debug element discovery
            debug.styled`Search input: ${this.searchInput ? debug.s.success('Found') : debug.s.error('Missing')}`;
            debug.styled`Author checkbox: ${this.authorCheckbox ? debug.s.success('Found') : debug.s.error('Missing')}`;
            debug.styled`Search button: ${this.searchButton ? debug.s.success('Found') : debug.s.error('Missing')}`;
            
            if (!this.searchInput || !this.authorCheckbox || !this.searchButton) {
                const error = 'Required search form elements not found';
                debug.styled`${debug.s.error('Initialization Error:')} ${error}`;
                throw new Error(error);
            }
            
            super.init();
            debug.styled`${debug.s.success('SearchFormComponent successfully initialized')}`;
        });
    }
    
    /**
     * @override
     */
    bindEvents() {
        debug.log('Binding SearchFormComponent events');
        
        // Button click event
        this.searchButton.addEventListener('click', () => {
            debug.styled`${debug.s.warning('Search button clicked')} - Executing manual search`;
            this.executeSearch(true);
        });
        
        // Enter key event
        this.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                debug.styled`${debug.s.warning('Enter key pressed')} - Executing manual search`;
                this.executeSearch(true);
            }
        });
        
        // Input change event (for auto-search)
        this.searchInput.addEventListener('input', () => {
            debug.styled`${debug.s.info('Input changed')} - Executing auto search`;
            this.executeSearch(false);
        });
        
        // Subscribe to app events
        this.eventService.subscribe('app:ready', () => {
            debug.log('App ready event received - Enabling search controls');
            this.searchInput.disabled = false;
            this.searchButton.disabled = false;
        });
        
        debug.log('SearchFormComponent events bound');
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
        
        debug.group(`Executing ${isManualSearch ? 'manual' : 'auto'} search`, () => {
            debug.styled`Search term: "${debug.s.info(searchTerm)}" (${debug.s.info(currentLength)} chars)`;
            debug.styled`Include author: ${includeAuthor ? debug.s.success('Yes') : debug.s.info('No')}`;
            
            // Get guidance message
            const message = this.searchService.getGuidanceMessage(
                currentLength, 
                isManualSearch
            );
            
            debug.styled`Guidance message: ${debug.s.important(message || '(empty)')}`;
            
            // Publish the guidance update
            debug.log('Publishing ui:updateGuidance event');
            this.eventService.publish('ui:updateGuidance', {
                currentLength,
                isManualSearch,
                message
            });
            
            // Hide min chars message when typing starts
            debug.log(`Publishing ui:showMinCharsMessage event with value: ${currentLength === 0}`);
            this.eventService.publish('ui:showMinCharsMessage', currentLength === 0);
            
            // Check if valid search
            const isValid = this.searchService.isValidSearch(
                searchTerm, 
                isManualSearch
            );
            
            debug.styled`Search validation: ${isValid ? debug.s.success('Valid') : debug.s.error('Invalid')}`;
            
            // Dispatch search event with validated term
            debug.log('Publishing search:requested event');
            debug.styled`Search term after validation: ${isValid ? debug.s.success(searchTerm) : debug.s.error('null')}`;
            
            this.eventService.publish('search:requested', {
                searchTerm: isValid ? searchTerm : null,
                includeAuthor,
                isManualSearch
            });
        });
    }
}