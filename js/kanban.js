/**
 * Kanban & Card Drag & Drop using SortableJS
 */

document.addEventListener('DOMContentLoaded', function () {
    // Select all containers that have tender-cards
    // We target .kanban-column and any other container that should be draggable
    const draggableContainers = document.querySelectorAll('.kanban-column, .tender-cards-container');

    // Initialize SortableJS for desktop drag and drop
    if (draggableContainers.length > 0) {
        draggableContainers.forEach(container => {
            new Sortable(container, {
                group: 'shared-cards',
                animation: 150,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                handle: '.drag-handle',
                onEnd: function (evt) {
                    updateCardStatus(evt.item, evt.to);
                }
            });
        });
    }

    function updateCardStatus(card, targetColumn) {
        const statusSpan = card.querySelector('.tender-status:first-child');
        if (statusSpan && targetColumn && targetColumn.classList.contains('kanban-column')) {
            const header = targetColumn.parentElement.querySelector('.kanban-header h6');
            if (header) {
                statusSpan.innerText = header.innerText;
            }
        }
    }

    // --- Mobile Kanban Logic ---
    const isMobile = () => window.innerWidth <= 768;
    const kanbanHeaderRow = document.getElementById('kanbanHeaderRow');
    const kanbanBoardRow = document.getElementById('kanbanBoardRow');
    const prevBtn = document.getElementById('kanbanPrevBtn');
    const nextBtn = document.getElementById('kanbanNextBtn');
    const moveModal = document.getElementById('moveCompetitionModal');
    let currentCardToMove = null;

    if (isMobile()) {
        // Tab Switching
        const headers = document.querySelectorAll('.kanban-header');
        headers.forEach(header => {
            header.addEventListener('click', function () {
                const columnIndex = this.getAttribute('data-column');
                switchColumn(columnIndex);
            });
        });

        // Header Scrolling Arrows
        if (prevBtn && nextBtn && kanbanHeaderRow) {
            const isRTL = document.documentElement.dir === 'rtl';
            prevBtn.addEventListener('click', () => {
                const scrollAmount = isRTL ? 150 : -150;
                kanbanHeaderRow.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
            nextBtn.addEventListener('click', () => {
                const scrollAmount = isRTL ? -150 : 150;
                kanbanHeaderRow.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }

        // Mobile Move Modal Logic
        const dragHandles = document.querySelectorAll('.drag-handle');
        dragHandles.forEach(handle => {
            handle.addEventListener('click', function (e) {
                if (isMobile()) {
                    e.preventDefault();
                    e.stopPropagation();
                    currentCardToMove = this.closest('.tender-card');
                    openMoveModal();
                }
            });
        });

        // Auto-activate first tab on load
        switchColumn(0);
    }

    function switchColumn(index) {
        // Update headers active state
        document.querySelectorAll('.kanban-header').forEach(h => h.classList.remove('active'));
        const activeHeader = document.querySelector(`.kanban-header[data-column="${index}"]`);
        if (activeHeader) activeHeader.classList.add('active');

        // Update columns and their parent wrappers active state
        document.querySelectorAll('.kanban-column').forEach(c => {
            c.classList.remove('active');
            const wrapper = c.closest('.col-lg-3');
            if (wrapper) wrapper.classList.remove('active');
        });

        const activeColumn = document.querySelector(`.kanban-column[data-column="${index}"]`);
        if (activeColumn) {
            activeColumn.classList.add('active');
            const activeWrapper = activeColumn.closest('.col-lg-3');
            if (activeWrapper) activeWrapper.classList.add('active');
        }

        // Reset active column scroll to top when switching
        if (activeColumn) {
            activeColumn.scrollTop = 0;
        }

        // Scroll header into view if needed
        if (activeHeader) {
            activeHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    function openMoveModal() {
        const currentColumnIndex = currentCardToMove.closest('.kanban-column').getAttribute('data-column');

        // Reset all current labels
        document.querySelectorAll('.current-label').forEach(label => {
            label.classList.add('d-none');
        });

        // Find and check the radio button for the current column
        const currentRadio = document.querySelector(`input[name="moveTarget"][value="${currentColumnIndex}"]`);
        if (currentRadio) {
            currentRadio.checked = true;

            // Show the "Current" label for this option
            const currentLabel = currentRadio.closest('.move-column-item').querySelector('.current-label');
            if (currentLabel) {
                currentLabel.classList.remove('d-none');
            }
        }

        const bsModal = new bootstrap.Modal(moveModal);
        bsModal.show();
    }

    const confirmMoveBtn = document.getElementById('confirmMoveBtn');
    if (confirmMoveBtn) {
        confirmMoveBtn.addEventListener('click', function () {
            const selectedRadio = document.querySelector('input[name="moveTarget"]:checked');
            if (selectedRadio && currentCardToMove) {
                const targetIndex = selectedRadio.value;
                const targetColumn = document.querySelector(`.kanban-column[data-column="${targetIndex}"]`);

                if (targetColumn) {
                    targetColumn.appendChild(currentCardToMove);
                    updateCardStatus(currentCardToMove, targetColumn);
                    bootstrap.Modal.getInstance(moveModal).hide();

                    // On mobile, switch to the target column to show the moved card
                    if (isMobile()) {
                        switchColumn(targetIndex);
                    }
                }
            }
        });
    }

    // Handle resize to reset column visibility if switching back to desktop
    window.addEventListener('resize', () => {
        if (!isMobile()) {
            document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.kanban-header').forEach(h => h.classList.remove('active'));
        } else {
            // Re-ensure first column (or active one) is shown on mobile
            const activeHeader = document.querySelector('.kanban-header.active');
            if (!activeHeader) {
                switchColumn(0);
            }
        }
    });

});
