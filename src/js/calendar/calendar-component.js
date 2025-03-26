// src/js/calendar/calendar-component.js

import BaseComponent from '../components/base-component.js';
import { formatArchiveDate } from '../utils/date-utils.js';
import { getFirstDayOfMonth } from './calendar-utils.js';

/**
 * Calendar component for displaying archive records in a monthly view
 * @extends BaseComponent
 */
export default class CalendarComponent extends BaseComponent {
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
        this.currentDate = new Date();
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
        // Format date for comparison (YYYY-MM-DD)
        // Instead of using toISOString which converts to UTC
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        // Find events for this day
        const events = this.records.filter(record => {
            if (!record.date) return false;
            
            // Create a date object from the record's date string
            const recordDate = new Date(record.date);
            // Format in the same way to avoid timezone issues
            const recordYear = recordDate.getFullYear();
            const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, '0');
            const recordDay = recordDate.getDate().toString().padStart(2, '0');
            const recordDateString = `${recordYear}-${recordMonth}-${recordDay}`;
            
            return recordDateString === dateString;
        });
        
        // Render events
        events.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'calendar-event p-1 text-xs rounded cursor-pointer truncate';
            eventEl.textContent = event.title || 'Untitled Event';
            eventEl.dataset.eventId = event.id;
            
            // Add click event to show details
            eventEl.addEventListener('click', () => this.showEventDetails(event));
            
            container.appendChild(eventEl);
        });
        
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
            // Format time
            const eventDate = new Date(event.date);
            const hours = eventDate.getHours().toString().padStart(2, '0');
            const minutes = eventDate.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;
            
            // Format duration
            const durationMinutes = Math.floor(event.duration / 60);
            const durationSeconds = event.duration % 60;
            const durationString = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
            
            eventsList += `
                <div class="p-3 bg-indigo-50 rounded-lg">
                    <div class="font-semibold text-indigo-800">${event.title || 'Untitled Event'}</div>
                    <div class="grid grid-cols-3 gap-1 text-sm mt-2">
                        <div class="font-semibold">Time:</div>
                        <div class="col-span-2">${timeString}</div>
                        
                        <div class="font-semibold">Duration:</div>
                        <div class="col-span-2">${durationString}</div>
                        
                        <div class="font-semibold">Author:</div>
                        <div class="col-span-2">${event.author || 'Unknown'}</div>
                    </div>
                    <button class="mt-2 text-xs text-indigo-600 hover:text-indigo-800" 
                            data-event-id="${event.id}">
                        View Details
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