// src/js/app.js

import AppController from './core/app-controller.js';

/**
 * Initialize application when DOM is fully loaded
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create main application controller
        window.app = new AppController();
        console.log('Archive application initialized');
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});