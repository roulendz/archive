import ArchiveApp from './archive-app.js';
import { initializeTooltips } from './utils/tooltips.js';

/**
 * Initializes application when DOM is fully loaded
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    /** @type {ArchiveApp} Application instance */
    new ArchiveApp();
    
    /** Initialize tooltips for interactive elements */
    initializeTooltips();
});