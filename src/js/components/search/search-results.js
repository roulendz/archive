// src/js/components/search/search-results.js

import BaseComponent from '../base-component.js';
import { formatArchiveDate } from '../../utils/date-utils.js';

/**
 * Search results display component
 * @extends BaseComponent
 */
export default class SearchResultsComponent extends BaseComponent {
    /** Maximum cards rendered at once. @type {number} */
    static RESULT_LIMIT = 200;

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

        // A common word such as "diev" matches well over a thousand records.
        // Rendering them all costs a synchronous multi-second layout on mobile,
        // and nobody reads past the first screenful.
        const visible = records.slice(0, SearchResultsComponent.RESULT_LIMIT);

        // Build off-document so the browser lays out once instead of per card.
        const fragment = document.createDocumentFragment();
        for (const record of visible) {
            fragment.appendChild(this.createRecordCard(record));
        }
        this.container.appendChild(fragment);

        if (records.length > visible.length) {
            this.container.appendChild(
                this.createOverflowNotice(visible.length, records.length));
        }
    }

    /**
     * Tell the user the list was truncated rather than silently hiding results.
     * @param {number} shown
     * @param {number} total
     * @returns {HTMLElement}
     */
    createOverflowNotice(shown, total) {
        const notice = document.createElement('div');
        notice.className =
            'col-span-full text-center text-sm text-gray-600 py-4 px-3';
        notice.textContent =
            `Parādīti pirmie ${shown} no ${total} ierakstiem. ` +
            `Precizējiet meklējumu, lai atrastu konkrēto ierakstu.`;
        return notice;
    }

    /**
     * Create individual record card
     * @param {import('../../utils/types.js').ArchiveRecord} record
     * @returns {HTMLElement} The created card element
     */
    createRecordCard(record) {
        if (!this.template) {
            this.template = document.getElementById('recordCardTemplate');
        }
        const card = this.template.content.cloneNode(true).querySelector('.record-card');

        // One call, two fields: formatArchiveDate builds a Date and runs two
        // Intl formatters, so calling it twice per card doubled that cost.
        const when = formatArchiveDate(record.date?.toString() || new Date());

        card.querySelector('.record-title').textContent = record.title;
        card.querySelector('.record-date').textContent = when.formatted;
        card.querySelector('.record-day').textContent = `(${when.dayName})`;
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