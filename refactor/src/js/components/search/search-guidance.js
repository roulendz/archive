// src/js/components/search/search-guidance.js

import BaseComponent from '../base-component.js';
import { debug } from '../../utils/debugservice-utils.js';

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
        debug.log('Initializing SearchGuidanceComponent');
        
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
        
        /**
         * Message templates for various states
         * @type {Object<string, string>}
         * @private
         */
        this._messages = {
            defaultNoResults: "Diemžēl nekas netika atrasts atbilstoši jūsu meklējumam.",
            minCharsDefault: "Automātiskai meklēšanai, lūdzu, ievadiet vismaz 5 rakstzīmes, vai 3 rakstzīmes manuālai meklēšanai.",
            placeholder: "Ievadiet meklēšanas kritērijus, lai atrastu ierakstus"
        };
        
        this._validateElements();
        this._initializeMessages();
        this.init();
    }
    
    /**
     * Initialize message content from JavaScript instead of HTML
     * @private
     */
    _initializeMessages() {
        debug.log('Initializing dynamic messages');
        
        // Update minCharsMessage content (no longer hardcoded in HTML)
        if (this.minCharsMessage) {
            this.minCharsMessage.textContent = this._messages.minCharsDefault;
            debug.log(`Set minCharsMessage content: "${this._messages.minCharsDefault}"`);
        }
        
        // Update default message content
        if (this.defaultMessage) {
            this.defaultMessage.textContent = this._messages.defaultNoResults;
            debug.log(`Set defaultMessage content: "${this._messages.defaultNoResults}"`);
        }
        
        // Store default message in data attribute for reference
        if (this.noResultsMessage) {
            this.noResultsMessage.dataset.defaultMessage = this._messages.defaultNoResults;
            debug.log(`Set noResultsMessage data attribute: "${this._messages.defaultNoResults}"`);
        }
        
        // Update placeholder message
        const placeholder = document.getElementById('recordsPlaceholder');
        if (placeholder) {
            placeholder.textContent = this._messages.placeholder;
            debug.log(`Set placeholder content: "${this._messages.placeholder}"`);
        }
    }
    
    /**
     * Validate that required DOM elements exist
     * @private
     */
    _validateElements() {
        const elements = {
            minCharsMessage: this.minCharsMessage,
            noResultsMessage: this.noResultsMessage,
            dynamicMessage: this.dynamicMessage,
            defaultMessage: this.defaultMessage
        };
        
        debug.group('Validating SearchGuidance DOM elements', () => {
            const missingElements = [];
            
            Object.entries(elements).forEach(([name, element]) => {
                const exists = !!element;
                debug.styled`${name}: ${exists ? debug.s.success('Found') : debug.s.error('Missing')}`;
                
                if (!exists) {
                    missingElements.push(name);
                }
            });
            
            if (missingElements.length > 0) {
                debug.styled`${debug.s.error('Missing elements:')} ${missingElements.join(', ')}`;
            } else {
                debug.styled`${debug.s.success('All elements found')}`;
            }
        });
    }
    
    /**
     * @override
     */
    init() {
        if (this.initialized) {
            debug.log('SearchGuidanceComponent already initialized, skipping');
            return;
        }
        
        if (!this.minCharsMessage || !this.noResultsMessage || 
            !this.dynamicMessage || !this.defaultMessage) {
            debug.styled`${debug.s.error('SearchGuidance:')} Required message elements not found`;
            console.error('SearchGuidance: Required message elements not found');
            return;
        }
        
        debug.log('Setting up SearchGuidanceComponent event subscriptions');
        this.setupEventSubscriptions();
        super.init();
        debug.styled`${debug.s.success('SearchGuidanceComponent initialized')}`;
    }
    
    /**
     * Setup event subscriptions for guidance updates
     * @returns {void}
     */
    setupEventSubscriptions() {
        // When search guidance should be updated
        this.eventService.subscribe('ui:updateGuidance', ({ message, currentLength, isManualSearch }) => {
            debug.group('Guidance update event received', () => {
                debug.styled`Length: ${debug.s.info(currentLength)}, Manual: ${isManualSearch ? debug.s.warning('Yes') : debug.s.info('No')}`;
                debug.styled`Message: ${debug.s.important(message || '(empty)')}`;
                
                // Hide min chars message when typing has started
                debug.log(`${currentLength === 0 ? 'Showing' : 'Hiding'} min chars message`);
                this.showMinCharsMessage(currentLength === 0);
                
                // Show dynamic message if we have one
                if (message) {
                    debug.styled`${debug.s.success('Showing dynamic message')}`;
                    this.showDynamicMessage(message);
                } else {
                    debug.log('No dynamic message to show');
                    this.hideNoResults();
                }
            });
        });
        
        // Handle min chars message visibility
        this.eventService.subscribe('ui:showMinCharsMessage', (show) => {
            debug.styled`${show ? debug.s.info('Showing') : debug.s.info('Hiding')} min chars message`;
            this.showMinCharsMessage(show);
        });
        
        // Handle no results message
        this.eventService.subscribe('search:resultsReady', (results) => {
            debug.group('Search results ready event', () => {
                debug.styled`Results count: ${debug.s.info(results ? results.length : 0)}`;
                
                if (results && results.length === 0) {
                    debug.styled`${debug.s.warning('No results found')} - Showing default no results message`;
                    // Show default no results message
                    this.showDefaultNoResults();
                } else {
                    debug.log('Results found - Hiding no results message');
                    this.hideNoResults();
                }
            });
        });
    }
    
    /**
     * Show minimum characters message
     * @param {boolean} show 
     * @returns {void}
     */
    showMinCharsMessage(show) {
        debug.styled`${debug.s.info('minCharsMessage visibility:')} ${show ? debug.s.success('Visible') : debug.s.error('Hidden')}`;
        this.minCharsMessage.classList.toggle('hidden', !show);
        this._logElementState('minCharsMessage', this.minCharsMessage);
    }
    
    /**
     * Show no results with dynamic message
     * @param {string} message 
     * @returns {void}
     */
    showDynamicMessage(message) {
        if (!message) {
            debug.styled`${debug.s.warning('Cannot show dynamic message:')} Empty message`;
            return;
        }
        
        debug.group('Showing dynamic message', () => {
            debug.styled`Message content: ${debug.s.important(message)}`;
            
            this.dynamicMessage.textContent = message;
            this.dynamicMessage.classList.remove('hidden');
            this.defaultMessage.classList.add('hidden');
            this.noResultsMessage.classList.remove('hidden');
            
            this._logElementState('dynamicMessage', this.dynamicMessage);
            this._logElementState('defaultMessage', this.defaultMessage);
            this._logElementState('noResultsMessage', this.noResultsMessage);
        });
    }
    
    /**
     * Show default no results message
     * @returns {void}
     */
    showDefaultNoResults() {
        debug.log('Showing default no results message');
        
        this.defaultMessage.classList.remove('hidden');
        this.dynamicMessage.classList.add('hidden');
        this.noResultsMessage.classList.remove('hidden');
        
        this._logElementState('defaultMessage', this.defaultMessage);
        this._logElementState('dynamicMessage', this.dynamicMessage);
        this._logElementState('noResultsMessage', this.noResultsMessage);
    }
    
    /**
     * Hide no results message
     * @returns {void}
     */
    hideNoResults() {
        debug.log('Hiding no results message');
        
        this.noResultsMessage.classList.add('hidden');
        this._logElementState('noResultsMessage', this.noResultsMessage);
    }
    
    /**
     * Log the state of an HTML element for debugging
     * @private
     * @param {string} name - Element name for logging
     * @param {HTMLElement} element - Element to inspect
     */
    _logElementState(name, element) {
        const isHidden = element.classList.contains('hidden');
        const isDisplayNone = window.getComputedStyle(element).display === 'none';
        const isVisible = !isHidden && !isDisplayNone;
        
        debug.styled`Element ${debug.s.info(name)}: ${isVisible ? debug.s.success('Visible') : debug.s.error('Hidden')} (class=${isHidden}, CSS=${isDisplayNone})`;
        debug.log(`Content: "${element.textContent.trim().substring(0, 50)}${element.textContent.length > 50 ? '...' : ''}"`);
    }
    
    /**
     * Update message templates programmatically
     * @param {Object<string, string>} messageUpdates
     * @returns {void}
     */
    updateMessages(messageUpdates) {
        debug.group('Updating message templates', () => {
            Object.entries(messageUpdates).forEach(([key, value]) => {
                if (this._messages.hasOwnProperty(key)) {
                    debug.styled`Updating message "${debug.s.info(key)}": ${value}`;
                    this._messages[key] = value;
                } else {
                    debug.styled`${debug.s.warning('Unknown message key:')} ${key}`;
                }
            });
        });
        
        // Re-initialize messages to apply updates
        this._initializeMessages();
    }
}