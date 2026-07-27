// src/js/utils/types.js

/**
 * One recording, or one catalogued item for which no file has been located yet.
 *
 * Roughly 400 records carry only id/date/title/author: they were transcribed
 * from the old cassette ledgers and their audio has not been found. Anything
 * reading `path`, `duration` or `fileType` must tolerate them being absent.
 *
 * @typedef {Object} ArchiveRecord
 * @property {number} id - Unique record identifier
 * @property {string} title - Record title
 * @property {string} date - ISO date string. Pre-2010 entries are date-only
 *   with a midnight time component; the time is not meaningful for those.
 * @property {string} author - Speaker, canonicalised where recognised
 * @property {string} [volume] - Logical disk holding the file, e.g. "SAT-E"
 * @property {string} [path] - Path relative to that volume's root. Never
 *   absolute: this file is published publicly.
 * @property {string} [series] - Teaching series the recording belongs to
 * @property {string} [group] - Legacy folder name; superseded by `series`
 * @property {string} [fileType] - Container extension, e.g. "mp3"
 * @property {number} [duration] - Length in seconds
 * @property {number} [bytes] - File size in bytes
 * @property {string} [quality] - Legacy video quality tag, e.g. "HD"
 * @property {string} [source] - "scan" when added by tools/Build-Archive.ps1
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