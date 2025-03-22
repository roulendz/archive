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
        
        debug.log('SearchService initialized with options:', {
            autoSearchMinChars: this.autoSearchMinChars,
            manualSearchMinChars: this.manualSearchMinChars
        });
    }
    
    /**
     * Validate search query based on trigger type
     * @param {string} searchTerm - Search query
     * @param {boolean} isManualTrigger - If manually triggered
     * @returns {boolean} Is valid search
     */
    isValidSearch(searchTerm, isManualTrigger) {
        if (!searchTerm) {
            debug.styled`isValidSearch: ${debug.s.error('Invalid')} - Empty search term`;
            return false;
        }
        
        const length = searchTerm.trim().length;
        const minRequired = isManualTrigger ? this.manualSearchMinChars : this.autoSearchMinChars;
        const isValid = length >= minRequired;
        
        debug.styled`isValidSearch: ${isValid ? debug.s.success('Valid') : debug.s.error('Invalid')} - 
            Term: "${searchTerm}" (${length} chars), 
            Trigger: ${isManualTrigger ? 'Manual' : 'Auto'}, 
            Min required: ${minRequired}`;
            
        return isValid;
    }
    
    /**
     * Generate guidance message based on input state
     * @param {number} currentLength - Current input length
     * @param {boolean} isManualTrigger - If manually triggered
     * @returns {string} Guidance message
     */
    getGuidanceMessage(currentLength, isManualTrigger) {
        // Debug entry point for the method
        debug.group(`getGuidanceMessage`, () => {
            debug.styled`Input state: ${debug.style({background: '#333', color: 'white', padding: '2px 5px'})('Length:')} ${debug.s.info(currentLength)} | ${debug.style({background: '#333', color: 'white', padding: '2px 5px'})('Trigger:')} ${isManualTrigger ? debug.s.warning('Manual') : debug.s.info('Auto')}`;
        });
        
        if (currentLength === 0) {
            debug.styled`Empty input - returning empty message`;
            return '';
        }
        
        const remainingAuto = Math.max(this.autoSearchMinChars - currentLength, 0);
        const remainingManual = Math.max(this.manualSearchMinChars - currentLength, 0);
        
        // Debug calculation of remaining characters
        debug.styled`
          ${debug.style({background: '#444', color: 'white', padding: '2px 6px'})('Remaining chars:')}
          ${debug.s.info(`Auto: ${remainingAuto} (${this.autoSearchMinChars} - ${currentLength})`)} 
          ${debug.s.warning(`Manual: ${remainingManual} (${this.manualSearchMinChars} - ${currentLength})`)}
        `;
        
        let message = '';
        let condition = 'none';
        
        // Debug which condition path is taken
        if (isManualTrigger) {
            condition = remainingManual > 0 ? 'manual-not-enough' : 'manual-enough';
            debug.styled`Condition path: ${debug.s.warning(condition)}`;
            
            message = remainingManual > 0 
                ? `Lūdzu, ievadiet vēl ${remainingManual} rakstzīmes, lai sāktu meklēšanu`
                : 'Rāda manuālās meklēšanas rezultātus';
        } else if (remainingAuto > 0) {
            condition = currentLength >= this.manualSearchMinChars ? 'auto-not-enough-but-manual-enough' : 'auto-not-enough';
            debug.styled`Condition path: ${debug.s.info(condition)}`;
            
            message = `Lūdzu, ievadiet vēl ${remainingAuto} rakstzīmes, lai sāktu automātisko meklēšanu`; 
            if (currentLength >= this.manualSearchMinChars) {
                message += ' vai noklikšķiniet uz Meklēt!';
                debug.styled`Added manual search suggestion to message`;
            }
        } else {
            condition = 'auto-enough';
            debug.styled`Condition path: ${debug.s.success(condition)}`;
            
            message = 'Rāda automātiskās meklēšanas rezultātus';
        }
        
        // Debug final message
        debug.styled`Final message (${debug.s.info(condition)}): ${debug.s.important(message)}`;
        
        return message;
    }
    
    /**
     * Debug helper to visualize the current state for all possible inputs
     * @param {number} maxLength - Maximum input length to simulate
     */
    debugAllPossibleStates(maxLength = 10) {
        debug.group('SearchService - All Possible States', () => {
            debug.styled`Configuration: ${debug.s.info(`Auto min: ${this.autoSearchMinChars}, Manual min: ${this.manualSearchMinChars}`)}`;
            
            debug.table([
                { length: this.autoSearchMinChars, isManual: false, message: this.getGuidanceMessage(this.autoSearchMinChars, false) },
                { length: this.manualSearchMinChars, isManual: true, message: this.getGuidanceMessage(this.manualSearchMinChars, true) }
            ]);
            
            debug.group('All Input Lengths (Auto Trigger)', true, () => {
                for (let i = 0; i <= maxLength; i++) {
                    const message = this.getGuidanceMessage(i, false);
                    debug.styled`Length ${i}: ${debug.style({
                        color: i >= this.autoSearchMinChars ? 'green' : 
                               i >= this.manualSearchMinChars ? 'orange' : 'red',
                        fontWeight: 'bold'
                    })(message || '(empty)')}`;
                }
            });
            
            debug.group('All Input Lengths (Manual Trigger)', true, () => {
                for (let i = 0; i <= maxLength; i++) {
                    const message = this.getGuidanceMessage(i, true);
                    debug.styled`Length ${i}: ${debug.style({
                        color: i >= this.manualSearchMinChars ? 'green' : 'red',
                        fontWeight: 'bold'
                    })(message || '(empty)')}`;
                }
            });
        });
    }
}