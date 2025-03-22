export default class ModalHandler {
    constructor(app) {
        this.app = app;
        this.modals = {
            edit: document.getElementById('editModal'),
            revisions: document.getElementById('revisionsModal')
        };
        this.initializeModalEvents();
    }

    initializeModalEvents() {
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Edit form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.app.saveRecordChanges();
        });
    }

    closeAllModals() {
        Object.values(this.modals).forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    showModal(modalType) {
        this.closeAllModals();
        this.modals[modalType]?.classList.remove('hidden');
    }
}