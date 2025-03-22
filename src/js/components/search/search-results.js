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
        
        if (!this.loadingIndicator) {
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
        
        // Listen for record updates
        this.eventService.subscribe('record:updated', (record) => {
            this.updateRecordCard(record);
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
        
        records.forEach(record => this.createRecordCard(record));
    }
    
    /**
     * Create individual record card
     * @param {import('../../utils/types.js').ArchiveRecord} record 
     * @returns {HTMLElement} The created card element
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
        
        // Add event listeners for buttons
        const editButton = card.querySelector('.edit-record');
        if (editButton) {
            editButton.addEventListener('click', () => this.handleEditClick(record.id));
        }
        
        const revisionsButton = card.querySelector('.view-revisions');
        if (revisionsButton) {
            revisionsButton.addEventListener('click', () => this.handleRevisionsClick(record.id));
        }
        
        // Add to container
        this.container.appendChild(card);
        
        return card;
    }
    
    /**
     * Update existing record card
     * @param {import('../../utils/types.js').ArchiveRecord} record 
     */
    updateRecordCard(record) {
        const card = this.container.querySelector(`[data-record-id="${record.id}"]`);
        if (!card) return;
        
        card.querySelector('.record-title').textContent = record.title;
        card.querySelector('.record-date').textContent = formatArchiveDate(record.date?.toString() || new Date()).formatted;
        card.querySelector('.record-day').textContent = `(${formatArchiveDate(record.date?.toString() || new Date()).dayName})`;
        card.querySelector('.record-author').textContent = record.author || 'Unknown';
    }
    
    /**
     * Handle edit button click
     * @param {string} recordId - ID of record to edit
     */
    handleEditClick(recordId) {
        this.eventService.publish('ui:openModal', { type: 'edit', recordId });
    }
    
    /**
     * Handle revisions button click
     * @param {string} recordId - ID of record to view revisions
     */
    handleRevisionsClick(recordId) {
        this.eventService.publish('ui:openModal', { type: 'revisions', recordId });
    }
}