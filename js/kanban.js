/**
 * Kanban & Card Drag & Drop using SortableJS
 */

document.addEventListener('DOMContentLoaded', function () {
    // Select all containers that have tender-cards
    // We target .kanban-column and any other container that should be draggable
    const draggableContainers = document.querySelectorAll('.kanban-column, .tender-cards-container');

    if (draggableContainers.length > 0) {
        draggableContainers.forEach(container => {
            new Sortable(container, {
                group: 'shared-cards', // Allows dragging between columns and other containers if they share the group
                animation: 150,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                handle: '.drag-handle',
                onEnd: function (evt) {
                    const card = evt.item;
                    const targetColumn = evt.to;
                    const statusSpan = card.querySelector('.tender-status:first-child');

                    // Only update status if it dropped into a Kanban column
                    if (statusSpan && targetColumn && targetColumn.classList.contains('kanban-column')) {
                        const header = targetColumn.parentElement.querySelector('.kanban-header h6');
                        if (header) {
                            statusSpan.innerText = header.innerText;
                        }
                    }
                }
            });
        });
    }

    // Initialize Bootstrap tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: 'hover',
        delay: { show: 0, hide: 0 }
    }));
});
