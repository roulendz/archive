import SearchHandler from './search-handler.js';
import ModalHandler from './modal-handler.js';
import RenderEngine from './render-engine.js';
import DataService from './data-service.js';

export default class ArchiveApp {
    constructor() {
        this.dataService = new DataService();
        this.renderEngine = new RenderEngine();
        this.searchHandler = new SearchHandler(this);
        this.modalHandler = new ModalHandler(this);
        
        // Remove the immediate initialization
        this.initialize().catch(console.error);
    }

    async initialize() {
        this.records = await this.dataService.loadRecords();
        // Removed the renderRecords call here
    }
    
    // Add new method for searching
    performSearch(searchTerm, includeAuthor) {
        let filteredRecords = this.records;
        
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

        this.renderEngine.renderRecords(filteredRecords.length ? filteredRecords : []);
    }
}