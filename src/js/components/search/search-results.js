// src/js/components/search/search-results.js

import BaseComponent from '../base-component.js';
import { formatArchiveDate } from '../../utils/date-utils.js';

/**
 * Search results display component
 * @extends BaseComponent
 */
export default class SearchResultsComponent extends BaseComponent {
    /**
     * @param {HTMLElement|string} container 
     * @param {Object} services - Application services
     * @param {import('../../services/event-service.js').default} services.eventService
     */
    constructor(container, { eventService }) {
        super(container);
        
        /** @type {import('../../services/event-service.js').default} */
        this.eventService = eventService;

        
        /** @type {HTMLElement|null} */
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        this.init();
    }
    
    /**
     * @override
     */
    init() {
        if (this.initialized) return;
        
        if ( !this.loadingIndicator) {
        throw new Error('Required search results elements not found');
        }
        
        this.setupEventSubscriptions();
        super.init();
    }
    
    /**
     * Setup event subscriptions
     * @returns {void}
     */
    setupEventSubscriptions() {
        // Listen for search results
        this.eventService.subscribe('search:resultsReady', (records) => {
        this.renderRecords(records);
        });
        
        // Listen for search invalidity
        this.eventService.subscribe('search:invalid', () => {
        this.renderRecords(null);
        });
        
        // Listen for loading state changes
        this.eventService.subscribe('ui:loading', (isLoading) => {
        this.loadingIndicator.classList.toggle('hidden', !isLoading);
        });
    }
    
    /**
     * Render search results
     * @param {Array<import('../../utils/types.js').ArchiveRecord>|null} records 
     * @returns {void}
     */
    renderRecords(records) {
        this.container.innerHTML = '';
        
        if (records === null) return;
        
        const hasResults = records.length > 0;
        
        records.forEach(record => this.createRecordCard(record));
    }
    
    /**
     * Create individual record card
     * @param {import('../../utils/types.js').ArchiveRecord} record 
     * @returns {void}
     */
    createRecordCard(record) {
        // Get the template and clone it
        const template = document.getElementById('recordCardTemplate');
        const card = template.content.cloneNode(true).querySelector('.record-card');
        
        // Fill in the data
        card.querySelector('.record-title').textContent = record.title;
        card.querySelector('.record-date').textContent = formatArchiveDate(record.date?.toString() || new Date()).formatted;
        card.querySelector('.record-day').textContent = `(${formatArchiveDate(record.date?.toString() || new Date()).dayName})`;
        card.querySelector('.record-author').textContent = record.author || 'Unknown';
        
        // Add data attribute for record ID
        card.dataset.recordId = record.id;
        
        // Add to container
        this.container.appendChild(card);
        
        return card;
    }
    
    /**
     * Generate HTML for record card
     * @param {import('../../utils/types.js').ArchiveRecord} record 
     * @returns {string} HTML string
     */
    getCardHTML(record) {
        return `
        <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold text-gray-800">${record.title}</h3>
        </div>
        <div class="text-sm text-gray-600">
            ${this.getDateHTML(record)}
            ${this.getAuthorHTML(record)}
        </div>
        `;
    }
    
    /**
     * Generate date section HTML
     * @param {import('../../utils/types.js').ArchiveRecord} record 
     * @returns {string} HTML string
     */
    getDateHTML(record) {
        const { formatted, dayName } = formatArchiveDate(record.date?.toString() || new Date());
        return `
        <p class="mb-2 flex items-center gap-2">
            <i class="fas fa-calendar-day has-tooltip" data-tooltip="Date"></i>
            <span>${formatted}</span>
            <span class="text-xs text-gray-500">(${dayName})</span>
        </p>
        `;
    }
    
    /**
     * Generate author section HTML
     * @param {import('../../utils/types.js').ArchiveRecord} record 
     * @returns {string} HTML string
     */
    getAuthorHTML(record) {
        return `
        <p class="flex items-center gap-2">
            <i class="fas fa-user has-tooltip" data-tooltip="Author"></i>
            ${record.author || 'Unknown'}
        </p>
        `;
    }
}