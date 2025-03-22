// src/js/core/app-controller.js

import DataService from '../services/data-service.js';
import SearchService from '../services/search-service.js';
import EventService from '../services/event-service.js';
import SearchFormComponent from '../components/search/search-form.js';
import SearchResultsComponent from '../components/search/search-results.js';
import YearRangeComponent from '../components/common/year-range.js';
import { initializeTooltips } from '../utils/dom-utils.js';
import SearchGuidanceComponent from '../components/search/search-guidance.js';
import { debug } from '../utils/debugservice-utils.js';

/**
 * Main application controller
 * @class
 */
export default class AppController {
    /**
     * Initialize application with services and components
     */
    constructor() {
        debug.styled`${debug.s.large('Initializing Archive Application')}`;
        
        // Initialize services
        this.eventService = new EventService();
        this.dataService = new DataService();
        this.searchService = new SearchService();
        
        // Initialize components (after DOM is ready)
        this.initComponents();
        
        // Setup event monitoring
        this._monitorEvents();
        
        // Bootstrap application
        this.bootstrap().catch(error => {
            debug.styled`${debug.s.error('Bootstrap Error:')} ${error.message}`;
            console.error(error);
        });
    }
    
    /**
     * Initialize UI components
     * @returns {void} 
     */
    initComponents() {
        debug.group('Initializing Components', () => {
            try {
                // Core UI components
                this.yearRange = new YearRangeComponent('#yearRange', '#yearSpan');
                debug.log('Initialized YearRangeComponent');
                
                // Verify eventService before passing to components
                console.log('EventService before SearchFormComponent:', this.eventService);
                
                this.searchForm = new SearchFormComponent('#searchForm', {
                    eventService: this.eventService,
                    searchService: this.searchService
                });
                debug.log('Initialized SearchFormComponent');
                
                this.searchResults = new SearchResultsComponent('#recordsContainer', {
                    eventService: this.eventService
                });
                debug.log('Initialized SearchResultsComponent');

                this.searchGuidance = new SearchGuidanceComponent('#searchGuidance', {
                    eventService: this.eventService,
                    searchService: this.searchService
                });
                debug.log('Initialized SearchGuidanceComponent');
                
                // Initialize tooltips
                initializeTooltips();
                debug.log('Initialized tooltips');
            } catch (error) {
                console.error('Error initializing components:', error);
                throw error;
            }
        });
    }
    
    /**
     * Set up monitoring for important events
     * @private
     */
    _monitorEvents() {
        debug.log('Setting up event monitoring');
        
        // Monitor guidance-related events
        this.eventService.subscribe('ui:updateGuidance', (data) => {
            debug.group('Event: ui:updateGuidance', () => {
                debug.styled`Length: ${debug.s.info(data.currentLength)}`;
                debug.styled`Manual: ${data.isManualSearch ? debug.s.warning('Yes') : debug.s.info('No')}`;
                debug.styled`Message: ${debug.s.important(data.message || '(empty)')}`;
            });
        });
        
        // Monitor search requests
        this.eventService.subscribe('search:requested', (data) => {
            // Check for null or undefined before accessing properties
            const searchTerm = data && data.searchTerm ? data.searchTerm : '(empty)';
            const isManual = data && typeof data.isManualSearch === 'boolean' ? data.isManualSearch : false;
            
            debug.styled`${debug.s.info('Event:')} search:requested - Term: "${searchTerm}", Manual: ${isManual ? 'Yes' : 'No'}`;
        });
        
        // Monitor search start
        this.eventService.subscribe('search:started', (data) => {
            // Check for null or undefined before accessing properties
            const searchTerm = data && data.searchTerm ? data.searchTerm : '(empty)';
            const isManual = data && typeof data.isManualSearch === 'boolean' ? data.isManualSearch : false;
            
            debug.styled`${debug.s.info('Event:')} search:started - Term: "${searchTerm}", Manual: ${isManual ? 'Yes' : 'No'}`;
        });
        
        // Monitor search results - FIXED to safely handle null results
        this.eventService.subscribe('search:resultsReady', (results) => {
            // Safely access the length property
            const resultsCount = results && Array.isArray(results) ? results.length : 0;
            debug.styled`${debug.s.info('Event:')} search:resultsReady - Results: ${resultsCount}`;
        });
        
        // Monitor search invalidation
        this.eventService.subscribe('search:invalid', (data) => {
            // Check for null or undefined before accessing properties
            const searchTerm = data && data.searchTerm ? data.searchTerm : '(empty)';
            const isManual = data && typeof data.isManualSearch === 'boolean' ? data.isManualSearch : false;
            
            debug.styled`${debug.s.info('Event:')} search:invalid - Term: "${searchTerm}", Manual: ${isManual ? 'Yes' : 'No'}`;
        });
        
        // Monitor min chars message
        this.eventService.subscribe('ui:showMinCharsMessage', (show) => {
            debug.styled`${debug.s.info('Event:')} ui:showMinCharsMessage - Show: ${show ? 'Yes' : 'No'}`;
        });
    }
    
    /**
     * Bootstrap application and load data
     * @async
     * @returns {Promise<void>}
     */
    async bootstrap() {
        debug.group('Bootstrapping Application', () => {
            debug.log('Setting up event listeners');
            // Setup event subscriptions
            this.setupEventListeners();
            
            debug.log('Bootstrap process starting');
        });
        
        // Load initial data
        try {
            debug.styled`${debug.s.info('Bootstrap:')} Showing initial guidance message`;
            // Show initial guidance message
            this.eventService.publish('ui:showMinCharsMessage', true);
            
            debug.styled`${debug.s.info('Bootstrap:')} Loading records from data service`;
            // Load data
            await this.dataService.loadRecords();
            
            debug.styled`${debug.s.info('Bootstrap:')} Updating year range display`;
            // Update year range display
            const yearRange = this.dataService.getYearRange();
            this.eventService.publish('data:yearRangeLoaded', yearRange);
            
            debug.styled`${debug.s.success('Bootstrap:')} Application ready`;
            // Ready for searching
            this.eventService.publish('app:ready', true);
        } catch (error) {
            debug.styled`${debug.s.error('Bootstrap Error:')} Failed to load archive data - ${error.message}`;
            
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
        debug.log('Setting up event listeners');
        
        // Handle search requests
        this.eventService.subscribe('search:requested', (searchOptions) => {
            // Handle potential null or undefined searchOptions
            if (!searchOptions) {
                debug.styled`${debug.s.error('Invalid search options:')} null or undefined`;
                return;
            }
            
            const { searchTerm, includeAuthor, isManualSearch } = searchOptions;
            
            // Debug search request details
            debug.styled`
                ${debug.s.info('Search Requested:')}
                Term: ${debug.s.info(searchTerm || '(empty)')}
                Author: ${debug.s.info(includeAuthor ? 'Yes' : 'No')}
                Trigger: ${isManualSearch ? debug.s.warning('Manual') : debug.s.info('Auto')}
            `;
            
            // Validate search
            const isValid = this.searchService.isValidSearch(
                searchTerm, 
                isManualSearch
            );
            
            // Check which guidance message would be shown
            const guidanceMessage = this.searchService.getGuidanceMessage(
                searchTerm ? searchTerm.trim().length : 0,
                isManualSearch
            );
            
            debug.styled`Guidance message: ${debug.s.important(guidanceMessage)}`;
            
            if (isValid) {
                debug.styled`${debug.s.success('Search is valid')} - Processing request`;
                
                // Get filtered records
                const startTime = performance.now();
                const results = this.dataService.searchRecords({
                    searchTerm,
                    includeAuthor
                });
                const endTime = performance.now();
                
                // Ensure results is an array
                const safeResults = Array.isArray(results) ? results : [];
                
                // Debug search results
                debug.styled`
                    ${debug.s.success('Search completed')}
                    Results: ${debug.s.info(safeResults.length)}
                    Time: ${debug.s.info((endTime - startTime).toFixed(2) + 'ms')}
                `;
                
                // Log first few results 
                if (safeResults.length > 0) {
                    debug.group('First 3 results', () => {
                        safeResults.slice(0, 3).forEach((result, index) => {
                            debug.log(`Result ${index + 1}:`, result);
                        });
                    });
                }
                
                // Update UI with results - always use the safe array
                this.eventService.publish('search:resultsReady', safeResults);
            } else {
                debug.styled`${debug.s.error('Search is invalid')} - Showing guidance`;
                
                // No need to publish search:invalid here as it's done in SearchFormComponent
                // Only if there's no search term at all (empty search), clear results
                if (!searchTerm) {
                    // Always pass an empty array instead of null
                    this.eventService.publish('search:resultsReady', []);
                }
            }
        });
    }
}