// src/js/core/app-controller.js

import DataService from '../services/data-service.js';
import SearchService from '../services/search-service.js';
import EventService from '../services/event-service.js';
import SearchFormComponent from '../components/search/search-form.js';
import SearchResultsComponent from '../components/search/search-results.js';
import YearRangeComponent from '../components/common/year-range.js';
import ModalComponent from '../components/modals/modal-component.js';
import SearchGuidanceComponent from '../components/search/search-guidance.js';
import { initializeTooltips } from '../utils/dom-utils.js';
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
        // Don't wrap critical initialization in debug.group
        debug.log('Initializing Components');
        
        try {
            // Core UI components
            this.yearRange = new YearRangeComponent('#yearRange', '#yearSpan', {
                eventService: this.eventService,
            });
            debug.log('Initialized YearRangeComponent');
            
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
            
            // Modal components
            this.modalComponent = new ModalComponent('#modalsContainer', {
                eventService: this.eventService,
                dataService: this.dataService
            });
            debug.log('Initialized ModalComponent');

            // Initialize tooltips
            initializeTooltips();
            debug.log('Initialized tooltips');
        } catch (error) {
            console.error('Error initializing components:', error);
            throw error;
        }
    }
    
    /**
     * Set up monitoring for important events
     * @private
     */
    _monitorEvents() {
        debug.log('Setting up event monitoring');
        
        // Monitor guidance-related events
        this.eventService.subscribe('ui:updateGuidance', (data) => {
            // Move debug-only code out of the main execution path
            debug.log('Event: ui:updateGuidance', data);
        });
        
        // Monitor search requests
        this.eventService.subscribe('search:requested', (data) => {
            // Check for null or undefined before accessing properties
            const searchTerm = data && data.searchTerm ? data.searchTerm : '(empty)';
            const isManual = data && typeof data.isManualSearch === 'boolean' ? data.isManualSearch : false;
            
            debug.log('Event: search:requested', { searchTerm, isManual });
        });
        
        // Monitor search start
        this.eventService.subscribe('search:started', (data) => {
            // Check for null or undefined before accessing properties
            const searchTerm = data && data.searchTerm ? data.searchTerm : '(empty)';
            const isManual = data && typeof data.isManualSearch === 'boolean' ? data.isManualSearch : false;
            
            debug.log('Event: search:started', { searchTerm, isManual });
        });
        
        // Monitor search results - FIXED to safely handle null results
        this.eventService.subscribe('search:resultsReady', (results) => {
            // Safely access the length property
            const resultsCount = results && Array.isArray(results) ? results.length : 0;
            debug.log('Event: search:resultsReady', { resultsCount });
        });
        
        // Monitor search invalidation
        this.eventService.subscribe('search:invalid', (data) => {
            // Check for null or undefined before accessing properties
            const searchTerm = data && data.searchTerm ? data.searchTerm : '(empty)';
            const isManual = data && typeof data.isManualSearch === 'boolean' ? data.isManualSearch : false;
            
            debug.log('Event: search:invalid', { searchTerm, isManual });
        });
        
        // Monitor min chars message
        this.eventService.subscribe('ui:showMinCharsMessage', (show) => {
            debug.log('Event: ui:showMinCharsMessage', { show });
        });
    }
    
    /**
     * Bootstrap application and load data
     * @async
     * @returns {Promise<void>}
     */
    async bootstrap() {
        // Don't wrap critical initialization in debug.group
        debug.log('Bootstrapping Application');
        debug.log('Setting up event listeners');
        
        // Setup event subscriptions
        this.setupEventListeners();
        
        debug.log('Bootstrap process starting');
        
        // Load initial data
        try {
            debug.log('Bootstrap: Showing initial guidance message');
            // Show initial guidance message
            this.eventService.publish('ui:showMinCharsMessage', true);
            
            debug.log('Bootstrap: Loading records from data service');
            // Load data
            await this.dataService.loadRecords();
            
            debug.log('Bootstrap: Updating year range display');
            // Update year range display
            const yearRange = this.dataService.getYearRange();
            this.eventService.publish('data:yearRangeLoaded', yearRange);
            
            debug.log('Bootstrap: Application ready');
            // Ready for searching
            this.eventService.publish('app:ready', true);
        } catch (error) {
            debug.log('Bootstrap Error: Failed to load archive data', error.message);
            
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
                debug.log('Invalid search options: null or undefined');
                return;
            }
            
            const { searchTerm, includeAuthor, isManualSearch } = searchOptions;
            
            // Debug search request details
            debug.log('Search Requested:', {
                term: searchTerm || '(empty)',
                includeAuthor: includeAuthor ? 'Yes' : 'No',
                trigger: isManualSearch ? 'Manual' : 'Auto'
            });
            
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
            
            debug.log('Guidance message:', guidanceMessage);
            
            if (isValid) {
                debug.log('Search is valid - Processing request');
                
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
                debug.log('Search completed', {
                    results: safeResults.length,
                    time: `${(endTime - startTime).toFixed(2)}ms`
                });
                
                // Log first few results 
                if (safeResults.length > 0) {
                    debug.log('First 3 results:', safeResults.slice(0, 3));
                }
                
                // Update UI with results - always use the safe array
                this.eventService.publish('search:resultsReady', safeResults);
            } else {
                debug.log('Search is invalid - Showing guidance');
                
                // No need to publish search:invalid here as it's done in SearchFormComponent
                // Only if there's no search term at all (empty search), clear results
                if (!searchTerm) {
                    // Always pass an empty array instead of null
                    this.eventService.publish('search:resultsReady', []);
                }
            }
        });

        // Handle record updates
        this.eventService.subscribe('record:update', (updateData) => {
            // Update the record
            const updatedRecord = this.dataService.updateRecord(updateData);
            
            if (updatedRecord) {
                // Publish event that record was updated
                this.eventService.publish('record:updated', updatedRecord);
            }
        });

        // Handle revisions request
        this.eventService.subscribe('data:requestRevisions', ({ recordId }) => {
            // Get revisions
            const revisions = this.dataService.getRevisions(recordId);
            
            // Publish revisions
            this.eventService.publish('data:revisionsReady', {
                recordId,
                revisions
            });
        });

    }
}