export default class DataService {
    jsonFilePath = 'archive_20250322_184450.json';

    async loadRecords() {
        try {
            const response = await fetch(this.jsonFilePath);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error loading records:', error);
            throw error;
        }
    }
}