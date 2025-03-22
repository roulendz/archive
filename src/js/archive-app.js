import SearchHandler from './search-handler.js';
import ModalHandler from './modal-handler.js';
import RenderEngine from './render-engine.js';
import DataService from './data-service.js';

export default class ArchiveApp {
    constructor() {
        this.dataService = new DataService();
        this.renderEngine = new RenderEngine();
        this.records = [];
        this.searchHandler = new SearchHandler(this);
        this.modalHandler = new ModalHandler(this);
        
        // Show initial message immediately
        this.renderEngine.showMinCharsMessage(true);
        
        this.initialize().catch(console.error);
    }

    async initialize() {
        this.records = await this.dataService.loadRecords();
        // Remove the initial search call completely
    }

    performSearch(searchTerm, includeAuthor) {
        let filteredRecords = [];
        
        if (searchTerm) {
            filteredRecords = this.records.filter(record => {
                const safeTitle = (record.title || '').toLowerCase();
                const safeDate = (record.date || '').toString();
                const safeAuthor = (record.author || '').toLowerCase();
                
                return safeTitle.includes(searchTerm) ||
                       safeDate.includes(searchTerm) ||
                       (includeAuthor && safeAuthor.includes(searchTerm));
            });
        }

        this.renderEngine.renderRecords(filteredRecords);
    }
}