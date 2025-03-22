// src/js/components/base-component.js

/**
 * Base component class with lifecycle methods and DOM management
 * @abstract
 */
export default class BaseComponent {
    /**
     * Create a component instance
     * @param {HTMLElement|string} container - Container element or selector
     */
    constructor(container) {
        /** @type {HTMLElement} */
        this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
        
        if (!this.container) {
        throw new Error(`Component container not found: ${container}`);
        }
        
        /** @type {boolean} */
        this.initialized = false;
        
        /** @type {Object<string, Function>} */
        this._eventHandlers = {};
    }
    
    /**
     * Initialize component (should be overridden)
     * @returns {void}
     */
    init() {
        if (this.initialized) return;
        this.bindEvents();
        this.initialized = true;
    }
    
    /**
     * Bind event listeners (should be overridden)
     * @protected
     * @returns {void}
     */
    bindEvents() {
        // Override in subclasses
    }
    
    /**
     * Register an event handler with automatic binding
     * @protected
     * @param {string} eventType - DOM event type
     * @param {string|HTMLElement} selector - Element or CSS selector
     * @param {Function} handler - Event handler
     * @returns {void}
     */
    on(eventType, selector, handler) {
        const element = typeof selector === 'string'
        ? this.container.querySelector(selector)
        : selector;
        
        if (!element) {
        console.warn(`Element not found for selector: ${selector}`);
        return;
        }
        
        // Bind handler to this component instance
        const boundHandler = handler.bind(this);
        element.addEventListener(eventType, boundHandler);
        
        // Store for cleanup
        const key = `${eventType}-${selector}`;
        this._eventHandlers[key] = { element, type: eventType, handler: boundHandler };
    }
    
    /**
     * Remove all registered event listeners
     * @returns {void}
     */
    destroy() {
        Object.values(this._eventHandlers).forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler);
        });
        this._eventHandlers = {};
        this.initialized = false;
    }
    
    /**
     * Render component (should be overridden)
     * @returns {void}
     */
    render() {
        // Override in subclasses
    }
}