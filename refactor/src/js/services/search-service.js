// src/js/services/search-service.js

import { debug } from '../utils/debugservice-utils.js';
/**
 * Service for search operations and validation
 * @class
 */
export default class SearchService {
    /**
     * @param {Object} [options] - Service configuration
     * @param {number} [options.autoSearchMinChars=5] - Min chars for auto search
     * @param {number} [options.manualSearchMinChars=3] - Min chars for manual search
     */
    constructor(options = {}) {
        /** @type {number} */
        this.autoSearchMinChars = options.autoSearchMinChars || 5;
        
        /** @type {number} */
        this.manualSearchMinChars = options.manualSearchMinChars || 3;
    }
    
    /**
     * Validate search query based on trigger type
     * @param {string} searchTerm - Search query
     * @param {boolean} isManualTrigger - If manually triggered
     * @returns {boolean} Is valid search
     */
    isValidSearch(searchTerm, isManualTrigger) {
        if (!searchTerm) return false;
        
        const length = searchTerm.trim().length;
        
        if (isManualTrigger) {
        return length >= this.manualSearchMinChars;
        }
        
        return length >= this.autoSearchMinChars;
    }
    
    /**
     * Generate guidance message based on input state
     * @param {number} currentLength - Current input length
     * @param {boolean} isManualTrigger - If manually triggered
     * @returns {string} Guidance message
     */
    getGuidanceMessage(currentLength, isManualTrigger) {
    if (currentLength === 0) return '';
    
    const remainingAuto = Math.max(this.autoSearchMinChars - currentLength, 0);
    const remainingManual = Math.max(this.manualSearchMinChars - currentLength, 0);
    
    let message = '';
    
    if (isManualTrigger) {
        message = remainingManual > 0 
        ? `Lūdzu, ievadiet vēl ${remainingManual} rakstzīmes, lai sāktu meklēšanu`
        : 'Rāda manuālās meklēšanas rezultātus';
    } else if (remainingAuto > 0) {
        message = `Lūdzu, ievadiet vēl ${remainingAuto} rakstzīmes, lai sāktu automātisko meklēšanu`; 
        if (currentLength >= this.manualSearchMinChars) {
        message += ' vai noklikšķiniet uz Meklēt!';
        }
    } else {
        message = 'Rāda automātiskās meklēšanas rezultātus';
    }
    return message;
    }
}