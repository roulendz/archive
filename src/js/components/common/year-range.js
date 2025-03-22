/**
 * Controller for year range display component
 * @class
 */
export default class YearRangeComponent {
    /**
     * @param {string} containerSelector 
     * @param {string} spanSelector 
     * @param {Object} [options]
     */
    constructor(containerSelector, spanSelector, options) {
        /** @type {HTMLElement} */
        this.container = document.querySelector(containerSelector);
        /** @type {HTMLElement} */
        this.spanElement = document.querySelector(spanSelector);
        
        // Add event listener for year range updates
        if (options?.eventService) {
            options.eventService.subscribe('data:yearRangeLoaded', ({ min, max }) => {
                this.update(min, max);
            });
        }

        if (options?.onReady) {
            options.onReady();
        }
    }

    /**
     * Updates display with year range and triggers animation
     * @param {number} min 
     * @param {number} max 
     */
    update(min, max) {
        this.spanElement.textContent = `${min} - ${max}`;
        this.container.classList.remove('hidden');
        this.container.classList.add('animate-slideIn');
    }
}