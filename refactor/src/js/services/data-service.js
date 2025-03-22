// src/js/services/data-service.js

/**
 * Service for data operations and state management
 * @class
 */
export default class DataService {
    /**
     * @param {Object} [options] - Service configuration 
     * @param {string} [options.jsonFilePath] - Path to JSON source
     */
    constructor(options = {}) {
        /** @type {string} */
        this.jsonFilePath = options.jsonFilePath || 'archive_20250322_184450.json';
        
        /** @type {Array<import('../utils/types.js').ArchiveRecord>} */
        this.records = [];
        
        /** @type {boolean} */
        this.isLoaded = false;
        
        /** @type {Error|null} */
        this.loadError = null;
    }
    
    /**
     * Load records from JSON source
     * @async
     * @returns {Promise<Array<import('../utils/types.js').ArchiveRecord>>}
     * @throws {Error} If data fetching fails
     */
    async loadRecords() {
        if (this.isLoaded) return this.records;
        
        try {
        const response = await fetch(this.jsonFilePath);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        this.records = await response.json();
        this.isLoaded = true;
        return this.records;
        } catch (error) {
        console.error('Error loading records:', error);
        this.loadError = error;
        throw error;
        }
    }
    
    /**
     * Get records filtered by search criteria
     * @param {import('../utils/types.js').SearchOptions} options
     * @returns {Array<import('../utils/types.js').ArchiveRecord>}
     */
    searchRecords({ searchTerm, includeAuthor }) {
        if (!searchTerm) return [];
        
        const query = searchTerm.toLowerCase();
        
        return this.records.filter(record => {
        const safeTitle = (record.title || '').toLowerCase();
        const safeDate = (record.date || '').toString();
        const safeAuthor = (record.author || '').toLowerCase();
        
        return safeTitle.includes(query) || 
                safeDate.includes(query) || 
                (includeAuthor && safeAuthor.includes(query));
        });
    }
    
    /**
     * Calculate year range from records
     * @returns {import('../utils/types.js').YearRange}
     */
    getYearRange() {
        if (!this.records.length) {
        return { min: 0, max: 0 };
        }
        
        const years = this.records.map(record => 
        new Date(record.date).getFullYear());
        
        return {
        min: Math.min(...years),
        max: Math.max(...years)
        };
    }
}