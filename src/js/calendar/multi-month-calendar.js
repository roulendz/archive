// src/js/calendar/multi-month-calendar.js

import BaseComponent from '../components/base-component.js';
import { formatArchiveDate } from '../utils/date-utils.js';
import { groupEventsByDate } from './calendar-utils.js';

/**
 * MultiMonth calendar component for displaying archive records in a yearly or multi-month view
 * @extends BaseComponent
 */
export default class MultiMonthCalendar extends BaseComponent {
    /**
     * @param {HTMLElement|string} container 
     * @param {Object} options - Component options
     * @param {import('../services/event-service.js').default} options.eventService
     * @param {import('../services/data-service.js').default} options.dataService
     */
    constructor(container, { eventService, dataService }) {
        super(container);
        
        /** @type {import('../services/event-service.js').default} */
        this.eventService = eventService;
        
        /** @type {import('../services/data-service.js').default} */
        this.dataService = dataService;
        
        /** @type {Object} */
        this.calendar = null;
        
        /** @type {Array<import('../utils/types.js').ArchiveRecord>} */
        this.records = [];
        
        /** @type {HTMLElement|null} */
        this.eventModal = document.getElementById('eventModal');
        
        /** @type {HTMLElement|null} */
        this.modalTitle = document.getElementById('modalTitle');
        
        /** @type {HTMLElement|null} */
        this.modalContent = document.getElementById('modalContent');
        
        /** @type {HTMLElement|null} */
        this.closeModalBtn = document.getElementById('closeModal');
    }
    
    /**
     * @override
     */
    init() {
        if (this.initialized) return;
        
        // Validate required elements
        if (!this.eventModal || !this.modalTitle || !this.modalContent || !this.closeModalBtn) {
            throw new Error('Required calendar elements not found');
        }
        
        // Load records
        this.dataService.loadRecords().then(records => {
            this.records = records;
            this.initializeFullCalendar();
        });
        
        this.bindEvents();
        this.initialized = true;
    }
    
    /**
     * @override
     */
    bindEvents() {
        // Modal close button
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        
        // Listen for view change events
        document.getElementById('viewSelector')?.addEventListener('change', (e) => {
            if (this.calendar) {
                this.calendar.changeView(e.target.value);
            }
        });
    }
    
    /**
     * Initialize FullCalendar with multiMonth view
     */
    initializeFullCalendar() {
        // Format records for FullCalendar
        const events = this.formatEventsForFullCalendar();
        
        // Get calendar element
        const calendarEl = this.container;
        
        // Initialize FullCalendar
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'multiMonthYear',
            initialDate: new Date(new Date().getFullYear(), 0, 1), // Always start with January 1st of current year
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'multiMonthYear,multiMonthFourMonth'
            },
            locale: 'lv', // Set Latvian locale
            views: {
                multiMonthYear: {
                    type: 'multiMonth',
                    duration: { months: 12 },
                    buttonText: 'Pilns gads'
                },
                multiMonthFourMonth: {
                    type: 'multiMonth',
                    duration: { months: 6 },
                    buttonText: '6 Mēneši'
                }
            },
            events: events,
            eventClick: this.handleEventClick.bind(this),
            height: 'auto',
            firstDay: 1, // Monday as first day
            multiMonthMaxColumns: 3,
            multiMonthMinWidth: 250,
            multiMonthTitleFormat: { month: 'long', year: 'numeric' }
        });
        
        // Render calendar
        this.calendar.render();
    }
    
    /**
     * Format archive records for FullCalendar
     * @returns {Array<Object>} Formatted events
     */
    formatEventsForFullCalendar() {
        return this.records.map(record => {
            return {
                id: record.id,
                title: record.title || 'Untitled Event',
                start: record.date,
                allDay: true,
                extendedProps: record
            };
        });
    }
    
    /**
     * Handle event click
     * @param {Object} info - FullCalendar event info
     */
    handleEventClick(info) {
        const event = info.event.extendedProps;
        this.showEventDetails(event);
    }
    
    /**
     * Show event details in modal
     * @param {import('../utils/types.js').ArchiveRecord} event - Event to show details for
     */
    showEventDetails(event) {
        // Set modal title
        this.modalTitle.textContent = event.title || 'Untitled Event';
        
        // Format date
        const dateObj = new Date(event.date);
        const formattedDate = formatArchiveDate(event.date);
        
        // Format time
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        // Format duration (seconds to minutes:seconds)
        const durationMinutes = Math.floor(event.duration / 60);
        const durationSeconds = event.duration % 60;
        const durationString = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
        
        // Build modal content
        this.modalContent.innerHTML = `
            <div class="grid grid-cols-3 gap-2 text-sm">
                <div class="font-semibold">Date:</div>
                <div class="col-span-2">${formattedDate.formatted} (${formattedDate.dayName})</div>
                
                <div class="font-semibold">Time:</div>
                <div class="col-span-2">${timeString}</div>
                
                <div class="font-semibold">Duration:</div>
                <div class="col-span-2">${durationString}</div>
                
                <div class="font-semibold">Author:</div>
                <div class="col-span-2">${event.author || 'Unknown'}</div>
                
                <div class="font-semibold">File Type:</div>
                <div class="col-span-2">${event.fileType || 'Unknown'}</div>
                
                <div class="font-semibold">Group:</div>
                <div class="col-span-2">${event.group || 'Unknown'}</div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="font-semibold mb-2">File Path:</div>
                <div class="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                    ${event.path || 'Unknown'}
                </div>
            </div>
        `;
        
        // Show modal
        this.eventModal.classList.remove('hidden');
    }
    
    /**
     * Close the event modal
     */
    closeModal() {
        this.eventModal.classList.add('hidden');
    }
}