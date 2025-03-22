// src/js/utils/types.js

/**
 * @typedef {Object} ArchiveRecord
 * @property {string} id - Unique record identifier
 * @property {string} title - Record title
 * @property {string} date - ISO date string
 * @property {string} author - Record author
 * @property {string} [content] - Optional record content
 */

/**
 * @typedef {Object} RecordRevision
 * @property {string} timestamp - Revision timestamp
 * @property {string} editorName - Name of editor
 * @property {string} editorEmail - Email of editor
 * @property {string} reason - Reason for update
 * @property {ArchiveRecord} previous - Previous record state
 */

/**
 * @typedef {Object} SearchOptions
 * @property {string} searchTerm - Search input value
 * @property {boolean} includeAuthor - Whether to include author in search
 * @property {boolean} isManualSearch - Whether search was triggered manually
 */

/**
 * @typedef {Object} YearRange
 * @property {number} min - Earliest year
 * @property {number} max - Latest year
 */