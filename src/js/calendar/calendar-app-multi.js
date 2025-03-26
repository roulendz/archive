// src/js/calendar/calendar-app-multi.js

import MultiMonthCalendar from './multi-month-calendar.js';
import DataService from '../../../src/js/services/data-service.js';
import EventService from '../../../src/js/services/event-service.js';
import { debug } from '../utils/debugservice-utils.js';

/**
 * Initialize multi-month calendar application when DOM is fully loaded
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    debug.styled`${debug.s.large('Multi-Month Calendar Application Starting')}`;
    
    try {
        // Initialize services
        const eventService = new EventService();
        const dataService = new DataService();
        
        // Initialize calendar component
        const multiMonthCalendar = new MultiMonthCalendar('#calendar', {
            eventService,
            dataService
        });
        
        // Make debug service available in console for manual debugging
        window.debug = debug;
        
        // Show loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }
        
        // Load data and initialize calendar
        dataService.loadRecords().then(records => {
            // Update year range display
            const yearRange = dataService.getYearRange();
            eventService.publish('data:yearRangeLoaded', yearRange);
            
            // Initialize calendar with records
            multiMonthCalendar.init();
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            
            debug.styled`${debug.s.success('Multi-Month calendar application initialized')}`;
        }).catch(error => {
            debug.styled`${debug.s.error('Failed to load records:')} ${error.message}`;
            console.error('Failed to load records:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        });
        
    } catch (error) {
        debug.styled`${debug.s.error('Failed to initialize multi-month calendar application:')} ${error.message}`;
        console.error('Failed to initialize multi-month calendar application:', error);
    }
});