// src/js/core/app-controller.js

import DataService from '../services/data-service.js';
import SearchService from '../services/search-service.js';
import EventService from '../services/event-service.js';
import SearchFormComponent from '../components/search/search-form.js';
import SearchResultsComponent from '../components/search/search-results.js';
import YearRangeComponent from '../components/common/year-range.js';
import { initializeTooltips } from '../utils/dom-utils.js';

/**
 * Main application controller
 * @class
 */
export default class AppController {
    /**
     * Initialize application with services and components
     */
    constructor() {
        // Initialize services
        this.eventService = new EventService();
        this.dataService = new DataService();
        this.searchService = new SearchService();
        
        // Initialize components (after DOM is ready)
        this.initComponents();
        
        // Bootstrap application
        this.bootstrap().catch(console.error);
    }
    
    /**
     * Initialize UI components
     * @returns {void} 
     */
    initComponents() {
        // Core UI components
        this.yearRange = new YearRangeComponent('#yearRange', '#yearSpan');
        
        this.searchForm = new SearchFormComponent('#searchForm', {
        eventService: this.eventService,
        searchService: this.searchService
        });
        
        this.searchResults = new SearchResultsComponent('#recordsContainer', {
        eventService: this.eventService
        });
        
        // Initialize tooltips
        initializeTooltips();
    }
    
    /**
     * Bootstrap application and load data
     * @async
     * @returns {Promise<void>}
     */
    async bootstrap() {
        // Setup event subscriptions
        this.setupEventListeners();
        
        // Load initial data
        try {
        // Show initial guidance message
        this.eventService.publish('ui:showMinCharsMessage', true);
        
        // Load data
        await this.dataService.loadRecords();
        
        // Update year range display
        const yearRange = this.dataService.getYearRange();
        this.eventService.publish('data:yearRangeLoaded', yearRange);
        
        // Ready for searching
        this.eventService.publish('app:ready', true);
        } catch (error) {
        this.eventService.publish('app:error', {
            message: 'Failed to load archive data',
            error
        });
        }
    }
    
    /**
     * Setup application event listeners
     * @returns {void}
     */
    setupEventListeners() {
        // Handle search requests
        this.eventService.subscribe('search:requested', (searchOptions) => {
        const { searchTerm, includeAuthor, isManualSearch } = searchOptions;
        
        // Validate search
        const isValid = this.searchService.isValidSearch(
            searchTerm, 
            isManualSearch
        );
        
        if (isValid) {
            // Get filtered records
            const results = this.dataService.searchRecords({
            searchTerm,
            includeAuthor
            });
            
            // Update UI
            this.eventService.publish('search:resultsReady', results);
        } else {
            // Show guidance for invalid search
            this.eventService.publish('search:invalid', searchOptions);
        }
        });
    }
}