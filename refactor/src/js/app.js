// src/js/app.js

import AppController from './core/app-controller.js';
import { debug } from './utils/debugservice-utils.js';

/**
 * Initialize application when DOM is fully loaded
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    debug.styled`${debug.s.large('Archive Application Starting')}`;
    
    try {
        // Create main application controller
        window.app = new AppController();
        
        // Make debug service available in console for manual debugging
        window.debug = debug;
        
        debug.styled`${debug.s.success('Archive application initialized')}`;
    } catch (error) {
        debug.styled`${debug.s.error('Failed to initialize application:')} ${error.message}`;
        console.error('Failed to initialize application:', error);
    }
});