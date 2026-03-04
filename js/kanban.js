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
    }

    function switchColumn(index) {
        // Update headers active state
        document.querySelectorAll('.kanban-header').forEach(h => h.classList.remove('active'));
        const activeHeader = document.querySelector(`.kanban-header[data-column="${index}"]`);
        if (activeHeader) activeHeader.classList.add('active');

        // Update columns active state
        document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('active'));
        const activeColumn = document.querySelector(`.kanban-column[data-column="${index}"]`);
        if (activeColumn) activeColumn.classList.add('active');

        // Scroll header into view if needed
        if (activeHeader) {
            activeHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    function openMoveModal() {
        const optionsContainer = document.getElementById('moveColumnOptions');
        optionsContainer.innerHTML = '';
        const headers = document.querySelectorAll('.kanban-header');
        const currentColumnIndex = currentCardToMove.closest('.kanban-column').getAttribute('data-column');

        headers.forEach(header => {
            const index = header.getAttribute('data-column');
            const title = header.querySelector('h6').innerText;
            const isActive = index === currentColumnIndex;

            const item = document.createElement('div');
            item.className = `move-column-item ${isActive ? 'active' : ''}`;
            item.innerHTML = `
                <div class="d-flex align-items-center justify-content-between w-100">
                    <span class="fz-14 black-text">${title}</span>
                    <div class="radio-circle"></div>
                </div>
            `;
            item.addEventListener('click', () => {
                document.querySelectorAll('.move-column-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                item.setAttribute('data-target-index', index);
            });
            optionsContainer.appendChild(item);
        });

        const bsModal = new bootstrap.Modal(moveModal);
        bsModal.show();
    }

    const confirmMoveBtn = document.getElementById('confirmMoveBtn');
    if (confirmMoveBtn) {
        confirmMoveBtn.addEventListener('click', function () {
            const activeOption = document.querySelector('.move-column-item.active[data-target-index]');
            if (activeOption && currentCardToMove) {
                const targetIndex = activeOption.getAttribute('data-target-index');
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
