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
        // Resolved against this module's own URL, so it works from any page
        // depth without sniffing window.location.
        this.jsonFilePath = options.jsonFilePath ||
            new URL('../../../archive.json', import.meta.url).href;

        /** @type {Array<import('../utils/types.js').ArchiveRecord>} */
        this.records = [];

        /**
         * Parallel array of pre-folded search keys, one per record. Building
         * this once at load avoids re-lowercasing every record on every
         * keystroke, and lets searches ignore Latvian diacritics.
         * @type {Array<{title: string, author: string, date: string}>}
         */
        this.searchIndex = [];

        /**
         * Records bucketed by YYYY-MM-DD, so a calendar day cell is an O(1)
         * lookup instead of a scan of the whole archive.
         * @type {Object<string, Array<import('../utils/types.js').ArchiveRecord>>}
         */
        this.recordsByDate = {};

        /** @type {boolean} */
        this.isLoaded = false;

        /** @type {Promise<Array>|null} */
        this.loadPromise = null;

        /** @type {Error|null} */
        this.loadError = null;
    }

    /**
     * Strip diacritics and case so "Jezus" matches "Jēzus".
     * @param {string} value
     * @returns {string}
     */
    static fold(value) {
        return (value || '')
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');
    }

    /**
     * Load records from JSON source
     * @async
     * @returns {Promise<Array<import('../utils/types.js').ArchiveRecord>>}
     * @throws {Error} If data fetching fails
     */
    async loadRecords() {
        if (this.isLoaded) return this.records;
        // Both calendar pages call this twice; without this the 2 MB payload
        // is fetched and parsed twice on a cold load.
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = (async () => {
            try {
                const response = await fetch(this.jsonFilePath);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                this.records = await response.json();
                this._buildIndexes();
                this.isLoaded = true;
                return this.records;
            } catch (error) {
                console.error('Error loading records:', error);
                this.loadError = error;
                this.loadPromise = null;
                throw error;
            }
        })();

        return this.loadPromise;
    }

    /**
     * Build the search index and the date buckets in a single pass.
     * @private
     */
    _buildIndexes() {
        const fold = DataService.fold;
        this.searchIndex = new Array(this.records.length);
        this.recordsByDate = {};

        for (let i = 0; i < this.records.length; i++) {
            const record = this.records[i];

            this.searchIndex[i] = {
                title: fold(record.title),
                author: fold(record.author),
                date: (record.date || '').toString()
            };

            if (record.date) {
                const key = record.date.toString().split('T')[0];
                (this.recordsByDate[key] ||= []).push(record);
            }
        }
    }

    /**
     * Get records filtered by search criteria
     * @param {import('../utils/types.js').SearchOptions} options
     * @returns {Array<import('../utils/types.js').ArchiveRecord>}
     */
    searchRecords({ searchTerm, includeAuthor }) {
        if (!searchTerm) return [];

        const query = DataService.fold(searchTerm);
        const results = [];

        for (let i = 0; i < this.records.length; i++) {
            const key = this.searchIndex[i];
            if (key.title.includes(query) ||
                key.date.includes(query) ||
                (includeAuthor && key.author.includes(query))) {
                results.push(this.records[i]);
            }
        }

        return results;
    }

    /**
     * Records for a single day.
     * @param {string} dateKey - YYYY-MM-DD
     * @returns {Array<import('../utils/types.js').ArchiveRecord>}
     */
    getRecordsForDate(dateKey) {
        return this.recordsByDate[dateKey] || [];
    }

    /**
     * Most recent date present in the archive. Calendars seed from this rather
     * than from today, which would open on an empty month.
     * @returns {Date|null}
     */
    getLatestDate() {
        let latest = null;
        for (const record of this.records) {
            if (!record.date) continue;
            const d = new Date(record.date);
            if (!Number.isNaN(d.getTime()) && (!latest || d > latest)) latest = d;
        }
        return latest;
    }

    /**
     * Calculate year range from records
     * @returns {import('../utils/types.js').YearRange}
     */
    getYearRange() {
        let min = Infinity;
        let max = -Infinity;

        for (const record of this.records) {
            if (!record.date) continue;
            const year = new Date(record.date).getFullYear();
            if (Number.isNaN(year)) continue;
            if (year < min) min = year;
            if (year > max) max = year;
        }

        if (min === Infinity) return { min: 0, max: 0 };
        return { min, max };
    }

    /**
     * Get a single record by ID
     * @param {string} recordId - ID of record to retrieve
     * @returns {import('../utils/types.js').ArchiveRecord|null} Record or null if not found
     */
    getRecordById(recordId) {
        // Ids are numbers in the JSON but arrive as strings from DOM datasets,
        // so compare as strings rather than letting === silently never match.
        const wanted = String(recordId);
        return this.records.find(record => String(record.id) === wanted) || null;
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
        // Same string/number mismatch that getRecordById guards against.
        const wanted = String(recordId);
        const index = this.records.findIndex(record => String(record.id) === wanted);
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

        // The search index and date buckets hold the pre-edit copy, so without
        // this an edited title stays unsearchable and the calendar keeps
        // showing the old text.
        this._buildIndexes();
        
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