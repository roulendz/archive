/** 
 * Handles search guidance UI messages and state
 * @class
 */
export class SearchGuidanceUI {
    /**
     * @param {HTMLElement} noResultsMessage 
     * @param {HTMLElement} minCharsMessage
     */
    constructor(noResultsMessage, minCharsMessage) {
        /** @type {HTMLElement} */
        this.noResultsMessage = noResultsMessage;
        /** @type {HTMLElement} */
        this.minCharsMessage = minCharsMessage;
    }

    /**
     * Updates search interface guidance messages
     * @param {number} currentLength - Current search input length
     * @param {boolean} isManualTrigger - Trigger type
     */
    updateSearchGuidance(currentLength, isManualTrigger) {
        const AUTO_SEARCH_MIN = 5;
        const MANUAL_SEARCH_MIN = 2;

        if (currentLength === 0) {
            this.showMinCharsMessage(true);
            this.showNoResults(false);
            return;
        }

        this.showMinCharsMessage(false);
        const remainingAuto = Math.max(AUTO_SEARCH_MIN - currentLength, 0);
        const remainingManual = Math.max(MANUAL_SEARCH_MIN - currentLength, 0);

        let message = '';
        if (isManualTrigger) {
            message = remainingManual > 0 
                ? `Lūdzu, ievadiet vēl ${remainingManual} rakstzīmes, lai sāktu automātisko meklēšan${remainingManual !== 1 ? 's' : ''} to search`
                : 'Showing manual search results';
        } else {
            if (remainingAuto > 0) {
                message = `Lūdzu, ievadiet vēl ${remainingAuto} rakstzīmes, lai sāktu${remainingAuto !== 1 ? 's' : ''} automātisko meklēšan`; 
                if (currentLength >= MANUAL_SEARCH_MIN) {
                    message += ' vai noklikšķiniet uz Meklēt!';
                }
            } else {
                message = 'Showing automatic search results';
            }
        }
        
        this.showNoResults(true, message);
    }

    /**
     * Toggles minimum character warning
     * @param {boolean} show - Visibility state
     */
    showMinCharsMessage(show) {
        this.minCharsMessage.classList.toggle('hidden', !show);
    }

    /**
     * Controls no-results message display
     * @param {boolean} show - Whether to display
     * @param {string} [customMessage=''] - Message content
     */
    showNoResults(show, customMessage = '') {
        const dynamicMsg = this.noResultsMessage.querySelector('#dynamicMessage');
        if (show) {
            dynamicMsg.textContent = customMessage;
            this.noResultsMessage.classList.add('show-dynamic');
        } else {
            this.noResultsMessage.classList.remove('show-dynamic');
            dynamicMsg.textContent = '';
        }
        this.noResultsMessage.classList.toggle('hidden', !show);
    }
}