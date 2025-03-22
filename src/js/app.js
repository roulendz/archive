import ArchiveApp from './archive-app.js';
import { initializeTooltips } from './utils/tooltips.js';

document.addEventListener('DOMContentLoaded', () => {
    new ArchiveApp();
    initializeTooltips();
});