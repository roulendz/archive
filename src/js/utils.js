export const showLoading = (isLoading) => {
    const loader = document.getElementById('loadingIndicator');
    loader.classList.toggle('hidden', !isLoading);
};

export const showError = (message) => {
    // Error display implementation
};