// src/js/calendar/calendar-component.js

import BaseComponent from '../components/base-component.js';
import { getFirstDayOfMonth, formatDuration } from './calendar-utils.js';
import { escapeHtml } from '../utils/dom-utils.js';
import { renderEventDetails } from './event-details.js';

/**
 * Calendar component for displaying archive records in a monthly view
 * @extends BaseComponent
 */
export default class CalendarComponent extends BaseComponent {
    /** Events shown inline in a day cell before collapsing to "+N more". */
    static MAX_VISIBLE_EVENTS = 3;

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
        
        /** @type {Date} */
        this.currentDate = new Date();
        
        /** @type {Array<import('../utils/types.js').ArchiveRecord>} */
        this.records = [];
        
        /** @type {HTMLElement|null} */
        this.monthYearDisplay = document.getElementById('currentMonthYear');
        
        /** @type {HTMLElement|null} */
        this.prevMonthBtn = document.getElementById('prevMonth');
        
        /** @type {HTMLElement|null} */
        this.nextMonthBtn = document.getElementById('nextMonth');
        
        /** @type {HTMLElement|null} */
        this.todayBtn = document.getElementById('todayBtn');
        
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
        if (!this.monthYearDisplay || !this.prevMonthBtn || !this.nextMonthBtn || 
            !this.todayBtn || !this.eventModal || !this.modalTitle || 
            !this.modalContent || !this.closeModalBtn) {
            throw new Error('Required calendar elements not found');
        }
        
        // Load records
        this.dataService.loadRecords().then(records => {
            this.records = records;
            // Open on the newest month that actually has recordings. Seeding
            // from today lands on an empty grid, which reads as a broken page.
            const latest = this.dataService.getLatestDate();
            if (latest) this.currentDate = latest;
            this.render();
        });
        
        this.bindEvents();
        this.initialized = true;
    }
    
    /**
     * @override
     */
    bindEvents() {
        // Navigation buttons
        this.prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
        this.todayBtn.addEventListener('click', () => this.goToToday());
        
        // Modal close button
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
    }
    
    /**
     * Navigate to previous/next month
     * @param {number} direction - Direction to navigate (-1 for previous, 1 for next)
     */
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.render();
    }
    
    /**
     * Go to current month
     */
    goToToday() {
        // "Today" on an archive that ends in the past is an empty month, so
        // fall back to the most recent month holding recordings.
        this.currentDate = this.dataService.getLatestDate() || new Date();
        this.render();
    }
    
    /**
     * @override
     */
    render() {
        // Update month/year display
        const monthName = this.currentDate.toLocaleString('lv-LV', { month: 'long' });
        const year = this.currentDate.getFullYear();
        this.monthYearDisplay.textContent = `${monthName} ${year}`;
        
        // Clear previous calendar days (except header row)
        const headerCells = Array.from(this.container.querySelectorAll('div')).slice(0, 7);
        this.container.innerHTML = '';
        
        // Re-add header cells
        headerCells.forEach(cell => this.container.appendChild(cell));
        
        // Generate calendar grid
        this.renderCalendarDays();
    }
    
    /**
     * Render calendar days for current month
     */
    renderCalendarDays() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month
        const firstDay = new Date(year, month, 1);
        
        // Get last day of month
        const lastDay = new Date(year, month + 1, 0);
        
        // Get day of week for first day (0 = Monday, 6 = Sunday)
        // Using utility function that handles the conversion from Sunday-based to Monday-based
        const firstDayIndex = getFirstDayOfMonth(year, month);
        
        // Get total days in month
        const totalDays = lastDay.getDate();
        
        // Get current date for highlighting today
        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
        
        // Create empty cells for days before first day of month
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day p-2 bg-gray-100 bg-opacity-30 rounded';
            this.container.appendChild(emptyCell);
        }
        
        // Create cells for each day in month
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dayCell = document.createElement('div');
            
            // Check if this day is today
            const isToday = isCurrentMonth && today.getDate() === day;
            
            dayCell.className = `calendar-day p-2 bg-white bg-opacity-70 rounded ${isToday ? 'today' : ''}`;
            
            // Add day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'text-right font-semibold text-gray-700';
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);
            
            // Add events container
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'mt-1 space-y-1 overflow-y-auto max-h-24';
            dayCell.appendChild(eventsContainer);
            
            // Find events for this day
            this.renderEventsForDay(date, eventsContainer);
            
            this.container.appendChild(dayCell);
        }
        
        // Add empty cells for days after last day of month to complete the grid
        const totalCells = firstDayIndex + totalDays;
        const remainingCells = 7 - (totalCells % 7);
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day p-2 bg-gray-100 bg-opacity-30 rounded';
                this.container.appendChild(emptyCell);
            }
        }
    }
    
    /**
     * Render events for a specific day
     * @param {Date} date - The date to render events for
     * @param {HTMLElement} container - Container to append events to
     */
    renderEventsForDay(date, container) {
        // Local date parts, not toISOString, which would shift across the UTC
        // boundary and file evening recordings under the wrong day.
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        // O(1) bucket lookup. This runs once per day cell, so scanning all
        // 8,000+ records here meant a quarter of a million Date allocations on
        // every month navigation.
        const events = this.dataService.getRecordsForDate(dateString);

        // Render at most three; the rest are reachable through the indicator
        // below, which previously claimed to hide events that were all present.
        for (const event of events.slice(0, CalendarComponent.MAX_VISIBLE_EVENTS)) {
            const eventEl = document.createElement('div');
            eventEl.className = 'calendar-event p-1 text-xs rounded cursor-pointer truncate';
            eventEl.textContent = event.title || 'Untitled Event';
            eventEl.dataset.eventId = event.id;
            eventEl.tabIndex = 0;
            eventEl.setAttribute('role', 'button');

            const open = () => this.showEventDetails(event);
            eventEl.addEventListener('click', open);
            eventEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            });

            container.appendChild(eventEl);
        }

        // If there are more than 3 events, show a "more" indicator
        if (events.length > 3) {
            const moreIndicator = document.createElement('div');
            moreIndicator.className = 'text-xs text-center text-indigo-600 font-semibold cursor-pointer';
            moreIndicator.textContent = `+${events.length - 3} more`;
            
            // Add click event to show all events for this day
            moreIndicator.addEventListener('click', () => this.showDayEvents(date, events));
            
            container.appendChild(moreIndicator);
        }
    }
    
    /**
     * Show event details in modal
     * @param {import('../utils/types.js').ArchiveRecord} event - Event to show details for
     */
    showEventDetails(event) {
        // Set modal title
        this.modalTitle.textContent = event.title || 'Untitled Event';

        this.modalContent.innerHTML = renderEventDetails(event);
        
        // Show modal
        this.eventModal.classList.remove('hidden');
    }
    
    /**
     * Show all events for a specific day
     * @param {Date} date - The date to show events for
     * @param {Array<import('../utils/types.js').ArchiveRecord>} events - Events for this day
     */
    showDayEvents(date, events) {
        // Format date for display
        const formattedDate = date.toLocaleDateString('lv-LV', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Set modal title
        this.modalTitle.textContent = `Events on ${formattedDate}`;
        
        // Build list of events
        let eventsList = '<div class="space-y-3">';
        
        events.forEach(event => {
            const eventDate = new Date(event.date);
            const hasTime = !Number.isNaN(eventDate.getTime()) &&
                (eventDate.getHours() !== 0 || eventDate.getMinutes() !== 0);
            const timeString = hasTime
                ? `${eventDate.getHours().toString().padStart(2, '0')}:` +
                  `${eventDate.getMinutes().toString().padStart(2, '0')}`
                : '—';

            const durationString = Number.isFinite(event.duration) && event.duration > 0
                ? formatDuration(event.duration)
                : '—';

            eventsList += `
                <div class="p-3 bg-indigo-50 rounded-lg">
                    <div class="font-semibold text-indigo-800">${escapeHtml(event.title || 'Untitled Event')}</div>
                    <div class="grid grid-cols-3 gap-1 text-sm mt-2">
                        <div class="font-semibold">Laiks:</div>
                        <div class="col-span-2">${timeString}</div>

                        <div class="font-semibold">Ilgums:</div>
                        <div class="col-span-2">${durationString}</div>

                        <div class="font-semibold">Autors:</div>
                        <div class="col-span-2">${escapeHtml(event.author || 'Nezināms')}</div>
                    </div>
                    <button class="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                            data-event-id="${escapeHtml(event.id)}">
                        Skatīt detaļas
                    </button>
                </div>
            `;
        });
        
        eventsList += '</div>';
        
        // Set modal content
        this.modalContent.innerHTML = eventsList;
        
        // Add event listeners to detail buttons
        this.modalContent.querySelectorAll('[data-event-id]').forEach(button => {
            button.addEventListener('click', () => {
                const eventId = button.dataset.eventId;
                const event = events.find(e => e.id.toString() === eventId);
                if (event) {
                    this.showEventDetails(event);
                }
            });
        });
        
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