// src/js/components/modals/modal-component.js

import BaseComponent from '../base-component.js';

/**
 * Component for managing application modals
 * @extends BaseComponent
 */
export default class ModalComponent extends BaseComponent {
    /**
     * @param {HTMLElement|string} container 
     * @param {Object} services - Application services
     * @param {import('../../services/event-service.js').default} services.eventService
     * @param {import('../../services/data-service.js').default} services.dataService
     */
    constructor(container, { eventService, dataService }) {
        super(container);
        
        /** @type {import('../../services/event-service.js').default} */
        this.eventService = eventService;
        
        /** @type {import('../../services/data-service.js').default} */
        this.dataService = dataService;
        
        /** @type {Object<string, HTMLElement>} */
        this.modals = {};
        
        this.init();
    }
    
    /**
     * @override
     */
    init() {
        if (this.initialized) return;
        
        // Find all modals
        this.modals = {
            edit: document.getElementById('editModal'),
            revisions: document.getElementById('revisionsModal')
        };
        
        // Setup handlers
        this.bindEvents();
        
        // Subscribe to events
        this.setupEventSubscriptions();
        
        super.init();
    }
    
    /**
     * @override
     */
    bindEvents() {
        // Setup close buttons for modals
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
            });
        });
        
        // Setup edit form submission
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditFormSubmit();
            });
        }
        
        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }
    
    /**
     * Setup event subscriptions
     */
    setupEventSubscriptions() {
        // Listen for modal open requests
        this.eventService.subscribe('ui:openModal', ({ type, recordId }) => {
            if (type === 'edit') {
                this.openEditModal(recordId);
            } else if (type === 'revisions') {
                this.openRevisionsModal(recordId);
            }
        });
    }
    
    /**
     * Open the edit modal with record data
     * @param {string} recordId - ID of record to edit
     */
    openEditModal(recordId) {
        if (!this.modals.edit) return;
        
        // Get record data
        const record = this.dataService.getRecordById(recordId);
        if (!record) {
            console.error(`Record with ID ${recordId} not found`);
            return;
        }
        
        // Fill form with record data
        document.getElementById('editRecordId').value = record.id;
        document.getElementById('editTitle').value = record.title;
        document.getElementById('editAuthor').value = record.author || '';
        document.getElementById('editDate').value = record.date ? record.date.split('T')[0] : '';
        
        // Clear editor fields
        document.getElementById('editorName').value = '';
        document.getElementById('editorEmail').value = '';
        document.getElementById('updateReason').value = '';
        
        // Show modal
        this.modals.edit.classList.remove('hidden');
    }
    
    /**
     * Open the revisions modal for a record
     * @param {string} recordId - ID of record to view revisions
     */
    openRevisionsModal(recordId) {
        if (!this.modals.revisions) return;
        
        // Clear previous revisions
        const container = document.getElementById('revisionsContainer');
        if (container) {
            container.innerHTML = '';
            
            // Request revisions data
            this.eventService.publish('data:requestRevisions', { recordId });
            
            // Show loading state
            const placeholder = document.createElement('p');
            placeholder.className = 'text-center text-gray-500 py-4';
            placeholder.textContent = 'Loading revision history...';
            container.appendChild(placeholder);
        }
        
        // Show modal
        this.modals.revisions.classList.remove('hidden');
    }
    
    /**
     * Close a modal
     * @param {HTMLElement} modal - Modal element to close
     */
    closeModal(modal) {
        modal.classList.add('hidden');
    }
    
    /**
     * Handle edit form submission
     */
    handleEditFormSubmit() {
        // Get form data
        const recordId = document.getElementById('editRecordId').value;
        const title = document.getElementById('editTitle').value;
        const author = document.getElementById('editAuthor').value;
        const date = document.getElementById('editDate').value;
        const editorName = document.getElementById('editorName').value;
        const editorEmail = document.getElementById('editorEmail').value;
        const updateReason = document.getElementById('updateReason').value;
        
        // Validate form (simplified)
        if (!title || !date || !editorName || !editorEmail || !updateReason) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Create update object
        const update = {
            recordId,
            updates: {
                title,
                author,
                date
            },
            editor: {
                name: editorName,
                email: editorEmail,
                reason: updateReason
            }
        };
        
        // Publish update event
        this.eventService.publish('record:update', update);
        
        // Close modal
        this.closeModal(this.modals.edit);
    }
}