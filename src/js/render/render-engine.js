import { SearchGuidanceUI } from './search-guidance-ui.js';
import { SearchResultsRenderer } from './search-results-renderer.js';

/** 
 * Facade for rendering operations
 * @class
 */
export default class RenderEngine {
    constructor() {
        /** @type {SearchGuidanceUI} */
        this.guidanceUI = new SearchGuidanceUI(
            document.getElementById('noResultsMessage'),
            document.getElementById('minCharsMessage')
        );
        
        /** @type {SearchResultsRenderer} */
        this.resultsRenderer = new SearchResultsRenderer(
            document.getElementById('recordsContainer'),
            document.getElementById('noResultsMessage')
        );
    }

    // Proxy methods to individual components
    updateSearchGuidance(...args) {
        this.guidanceUI.updateSearchGuidance(...args);
    }

    renderRecords(...args) {
        this.resultsRenderer.renderRecords(...args);
    }

    showMinCharsMessage(...args) {
        this.guidanceUI.showMinCharsMessage(...args);
    }

    showNoResults(...args) {
        this.guidanceUI.showNoResults(...args);
    }
}