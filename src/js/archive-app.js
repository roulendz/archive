import SearchHandler from './search-handler.js';
import ModalHandler from './modal-handler.js';
import RenderEngine from './render-engine.js';
import DataService from './data-service.js';

/**
 * Main application controller for archive functionality
 * @class
 */
export default class ArchiveApp {
    /**
     * @constructor
     * @throws {Error} If dependency initialization fails
     */
    constructor() {
        /** @type {DataService} */
        this.dataService = new DataService();
        /** @type {RenderEngine} */
        this.renderEngine = new RenderEngine();
        /** @type {Array<ArchiveRecord>} */
        this.records = [];
        /** @type {SearchHandler} */
        this.searchHandler = new SearchHandler(this);
        /** @type {ModalHandler} */
        this.modalHandler = new ModalHandler(this);

        // Show initial message immediately
        this.renderEngine.showMinCharsMessage(true);

        this.initialize().catch(console.error);
    }

    /**
     * Initializes core application data
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If data loading fails
     */
    async initialize() {
        this.records = await this.dataService.loadRecords();
        // Remove the initial search call completely
    }

    /**
     * Filters records based on search criteria
     * @param {string} searchTerm - Search query (case-insensitive)
     * @param {boolean} includeAuthor - Flag to include author in search
     * @returns {void}
     */
    performSearch(searchTerm, includeAuthor) {
        console.log('ArchiveApp.performSearch:', {
            searchTerm,
            includeAuthor,
            recordsCount: this.records.length
        });

        // Handle invalid searches before any processing
        if (searchTerm === null) {
            this.renderEngine.renderRecords(null);
            return;
        }

        /** @type {Array<ArchiveRecord>} */
        let filteredRecords = [];
        
        if (typeof searchTerm === 'string' && searchTerm) {
            const searchQuery = searchTerm.toLowerCase();
            
            filteredRecords = this.records.filter(record => {
                const safeTitle = (record.title || '').toLowerCase();
                const safeDate = (record.date || '').toString();
                const safeAuthor = (record.author || '').toLowerCase();

                return safeTitle.includes(searchQuery) ||
                       safeDate.includes(searchQuery) ||
                       (includeAuthor && safeAuthor.includes(searchQuery));
            });
        }

        console.log('ArchiveApp - filteredRecords:', filteredRecords.length);
        this.renderEngine.renderRecords(filteredRecords);
    }
}

/**
 * @typedef {Object} ArchiveRecord
 * @property {string} title
 * @property {string|number} date
 * @property {string} author
 * @property {string} content
 */