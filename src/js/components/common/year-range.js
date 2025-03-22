/**
 * Controller for year range display component
 * @class
 */
export default class YearRangeComponent {
    /**
     * @param {HTMLElement} container 
     * @param {HTMLElement} spanElement 
     */
    constructor(container, spanElement) {
        /** @type {HTMLElement} */
        this.container = container;
        /** @type {HTMLElement} */
        this.spanElement = spanElement;
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