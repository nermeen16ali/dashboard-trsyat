// document.querySelectorAll('.filter-select').forEach(select => {
//     const isMultiple = select.hasAttribute('multiple');
//     const choices = new Choices(select, {
//         searchEnabled: true,
//         searchPlaceholderValue: 'بحث...',
//         itemSelectText: '',
//         removeItemButton: isMultiple,
//         noResultsText: 'لا توجد نتائج',
//         shouldSort: false
//     });

//     // Handle tags only for multi-selects with regions-tags container
//     const tagsContainer = select.closest('.regions-wrapper')?.querySelector('.regions-tags');
//     if (tagsContainer) {
//         function updateTags() {
//             tagsContainer.innerHTML = '';
//             choices.getValue().forEach(item => {
//                 const tag = document.createElement('span');
//                 tag.className = 'selected-tag';
//                 tag.innerHTML = `${item.label} <button type="button" class="remove-btn" data-value="${item.value}">✕</button>`;
//                 tagsContainer.appendChild(tag);
//             });
//         }
//         select.addEventListener('change', updateTags);
//         tagsContainer.addEventListener('click', e => {
//             if (e.target.classList.contains('remove-btn')) {
//                 choices.removeActiveItemsByValue(e.target.dataset.value);
//                 updateTags();
//             }
//         });
//     }
// });

// Detect current language (recommended: <html lang="ar"> or <html lang="en">)
const lang = document.documentElement.lang || 'en';

// Translations
const i18n = {
    ar: {
        searchPlaceholder: 'بحث...',
        noResults: 'لا توجد نتائج'
    },
    en: {
        searchPlaceholder: 'Search...',
        noResults: 'No results found'
    }
};

// Fallback safety
const t = i18n[lang] || i18n.en;

document.querySelectorAll('.filter-select').forEach(select => {
    const isMultiple = select.hasAttribute('multiple');

    const choices = new Choices(select, {
        searchEnabled: true,
        searchPlaceholderValue: t.searchPlaceholder,
        itemSelectText: '',
        removeItemButton: isMultiple,
        noResultsText: t.noResults,
        shouldSort: false,
        direction: document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
    });

    // Handle tags only for multi-selects with regions-tags container
    const tagsContainer = select
        .closest('.regions-wrapper')
        ?.querySelector('.regions-tags');

    if (!tagsContainer) return;

    function updateTags() {
        tagsContainer.innerHTML = '';

        choices.getValue().forEach(item => {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';

            tag.innerHTML = `
                ${item.label}
                <button type="button"
                        class="remove-btn"
                        data-value="${item.value}">
                    ✕
                </button>
            `;

            tagsContainer.appendChild(tag);
        });
    }

    select.addEventListener('change', updateTags);

    tagsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('remove-btn')) {
            choices.removeActiveItemsByValue(e.target.dataset.value);
            updateTags();
        }
    });
});
