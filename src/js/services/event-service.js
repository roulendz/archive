// src/js/services/event-service.js

/**
 * Application event bus using pub/sub pattern
 * @class
 */
export default class EventService {
    constructor() {
        /** @type {Object<string, Array<Function>>} */
        this.subscribers = {};
    }
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Event identifier
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventName, callback) {
        if (!this.subscribers[eventName]) {
        this.subscribers[eventName] = [];
        }
        
        this.subscribers[eventName].push(callback);
        
        // Return unsubscribe function
        return () => {
        this.subscribers[eventName] = this.subscribers[eventName]
            .filter(cb => cb !== callback);
        };
    }
    
    /**
     * Publish an event with data
     * @param {string} eventName - Event identifier
     * @param {*} data - Event data
     * @returns {void}
     */
    publish(eventName, data) {
        if (!this.subscribers[eventName]) return;
        
        this.subscribers[eventName].forEach(callback => {
        try {
            callback(data);
        } catch (error) {
            console.error(`Error in event handler for ${eventName}:`, error);
        }
        });
    }
}