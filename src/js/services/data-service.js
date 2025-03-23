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

    /**
     * Get a single record by ID
     * @param {string} recordId - ID of record to retrieve
     * @returns {import('../utils/types.js').ArchiveRecord|null} Record or null if not found
     */
    getRecordById(recordId) {
        return this.records.find(record => record.id === recordId) || null;
    }

    /**
     * Update a record with new data and save revision history
     * @param {Object} updateData - Update information
     * @param {string} updateData.recordId - ID of record to update
     * @param {Object} updateData.updates - Fields to update
     * @param {Object} updateData.editor - Editor information
     * @returns {import('../utils/types.js').ArchiveRecord|null} Updated record or null if failed
     */
    updateRecord(updateData) {
        const { recordId, updates, editor } = updateData;
        
        // Find record
        const index = this.records.findIndex(record => record.id === recordId);
        if (index === -1) return null;
        
        // Create a copy of the original record for revision history
        const originalRecord = { ...this.records[index] };
        
        // Update record
        const updatedRecord = { 
            ...this.records[index],
            ...updates,
            lastUpdated: new Date().toISOString()
        };
        
        // Save to records array
        this.records[index] = updatedRecord;
        
        // Create revision history entry
        if (!this.revisions) this.revisions = {};
        if (!this.revisions[recordId]) this.revisions[recordId] = [];
        
        this.revisions[recordId].push({
            timestamp: new Date().toISOString(),
            editorName: editor.name,
            editorEmail: editor.email,
            reason: editor.reason,
            previous: originalRecord
        });
        
        return updatedRecord;
    }

    /**
     * Get revision history for a record
     * @param {string} recordId - ID of record to get revisions for
     * @returns {Array<import('../utils/types.js').RecordRevision>} Array of revisions
     */
    getRevisions(recordId) {
        if (!this.revisions || !this.revisions[recordId]) return [];
        return this.revisions[recordId];
    }

    /**
     * Get total number of loaded records
     * @returns {number}
     */
    getTotalRecords() {
        return this.records.length;
    }
}