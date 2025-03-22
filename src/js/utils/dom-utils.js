export function initializeTooltips() {
    const tooltip = document.createElement('div');
    tooltip.id = 'global-tooltip';
    tooltip.className = 'hidden absolute bg-gray-800 text-white px-2 py-1 rounded text-sm z-50';
    document.body.appendChild(tooltip);

    // Use event delegation for dynamic elements
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.has-tooltip');
        if (target) {
            const rect = target.getBoundingClientRect();
            tooltip.textContent = target.dataset.tooltip;
            tooltip.style.left = `${rect.left + window.scrollX}px`;
            tooltip.style.top = `${rect.top + window.scrollY - 35}px`;
            tooltip.classList.remove('hidden');
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        if (e.target.closest('.has-tooltip')) {
            tooltip.classList.add('hidden');
        }
    });
}