const WINNER_ICON = `<svg class="tr-flow-icon tr-flow-icon--success flex-shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.14" />
                          <path d="M5.25 8.1L7.1 9.95L10.85 6.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>`;

const DETAILS_BTN = `<a href="#tr-detail-full"
                            class="btn-main h-41 btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2">
                            <span>عرض التفاصيل</span>
                            <svg class="tr-flow-icon flex-shrink-0" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.35" />
                            <path d="M5.5 8H10.5M10.5 8L8.75 6.25M10.5 8L8.75 9.75" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                          </a>`;

export function statusBadge(headerBadge, { inHeader = false } = {}) {
  const mb = inHeader ? '' : ' mb-3';
  const tableBadge = (className, label) => ({
    className: `sm-ele fz-12 text-nowrap flex-shrink-0${mb} d-inline-block ${className}`,
    label,
  });

  switch (headerBadge) {
    case 'تمت الترسية':
      return tableBadge('bordered-8 badge-success', 'تمت الترسية');
    case 'ترسية تاريخية':
      return tableBadge('bordered-8 badge-success', 'ترسية تاريخية');
    case 'تحت التقييم':
      return tableBadge('badge-evaluation', 'مرحلة تقييم العروض');
    case 'فتح العروض':
      return tableBadge('bordered-8 badge-reviewed', 'فتح العروض');
    case 'انتهت':
      return tableBadge('bordered-8 badge-rejected', 'انتهت');
    default:
      if (!headerBadge) return null;
      return tableBadge('bordered-8 badge-draft', headerBadge);
  }
}

export function renderListingCard(c, opts = {}) {
  const pad = opts.pad ?? '                    ';
  const detailsBtn = opts.detailsBtnHtml ?? DETAILS_BTN;
  const badgeInHeader = Boolean(c.badgeInHeader);
  const badge = c.headerBadge ? statusBadge(c.headerBadge, { inHeader: badgeInHeader }) : null;
  const headerBadgeHtml = badge && badgeInHeader
    ? `\n${pad}      <span class="${badge.className}">${badge.label}</span>`
    : '';
  const bodyBadgeHtml = badge && !badgeInHeader
    ? `\n${pad}          <span class="${badge.className}">${badge.label}</span>`
    : '';

  const headerLabel = c.ref ? 'رقم/رمز المناقصة ' : `${c.headerPrimaryLabel || 'رقم/رمز المناقصة'} `;
  const headerValue = c.ref || c.headerPrimaryValue || '—';
  const titleDirAttr = c.dir ? ` dir="${c.dir}"` : '';

  const bodyPublishHtml = c.hideBodyPublishDate
    ? ''
    : `
${pad}          <div>
${pad}            <span class="fz-10 gray-text">تاريخ النشر</span>
${pad}            <span class="fz-14 black-text fw-medium ff-onest d-block" dir="ltr">${c.publishDate}</span>
${pad}          </div>`;

  const showTenderDetails = bodyBadgeHtml || bodyPublishHtml;
  const tenderDetailsBlock = showTenderDetails
    ? `
${pad}        <div class="d-lg-flex align-items-start tender-details gap-3">${bodyBadgeHtml}${bodyPublishHtml}
${pad}        </div>`
    : '';

  const publishRowLabel = c.publishRowAsPublishDate ? 'تاريخ النشر' : 'الطرح';
  const publishRowDateClass = c.publishRowAsPublishDate
    ? 'fz-14 black-text fw-medium ff-onest d-block'
    : 'black-text fz-12 fw-medium ff-onest';
  const publishRowDateWrap = c.publishRowAsPublishDate ? 'span' : 'div';

  const awardPriceBlock = c.awardValue
    ? `
                            <div class="tender-price mb-0">
                              <span class="fz-10 d-block mb-1 gray-text">قيمة الترسية</span>
                              <span class="fs-6 black-text fw-medium ff-onest">${c.awardValue}
                              <img src="images/ryall.svg" alt="ريال"></span>
                            </div>`
    : '';

  const winnerBlock = c.winner
    ? `
                          <div class="tr-sector-tender-winner__inner d-flex align-items-center gap-2">
                            ${WINNER_ICON}
                            <span class="fz-14 black-text fw-medium">${c.winner}</span>
                          </div>`
    : '';

  const applicants = c.applicants || '—';

  return `${pad}<div class="col-12 col-md-6 d-flex">
${pad}  <div class="tender-card tr-sector-listing-card p-3 mb-0 h-100 w-100 d-flex flex-column text-start">
${pad}    <div class="tender-header d-flex align-items-center justify-content-between gap-2 mb-2">
${pad}      <div class="tender-number">
${pad}        <span>${headerLabel}</span>
${pad}        <span class="fz-14 black-text fw-medium ff-onest" dir="ltr">${headerValue}</span>
${pad}      </div>${headerBadgeHtml}
${pad}    </div>
${pad}    <div class="tender-sections p-12 rounded-12 bg-white flex-grow-1">
${pad}      <div class="tender-section position-relative">${tenderDetailsBlock}
${pad}        <h6 class="tender-title"${titleDirAttr}>${c.title}</h6>
${pad}        <div class="tender-subtitle mb-2">${c.entity}</div>${awardPriceBlock}
${pad}      </div>
${pad}      <div class="tender-section d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-md-between position-relative company-details">
${pad}        <div class="gap-12 d-flex align-items-center">
${pad}          <img src="images/company-logo.png" class="company-logo" alt="">
${pad}          <div>
${pad}            <span class="fz-10 gray-text">الجهة المعلنة</span>
${pad}            <div class="fz-14 black-text">${c.entity}</div>
${pad}          </div>
${pad}        </div>
${pad}        <div class="pe-md-1">
${pad}          <span class="fz-10 gray-text">النشاط الأساسي</span>
${pad}          <div class="fz-14 black-text">${c.activity}</div>
${pad}        </div>
${pad}      </div>
${pad}      <div class="tender-section d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-md-between mb-0">
${pad}        <div class="d-flex align-items-center">
${pad}          <div class="sm-logo">
${pad}            <img src="images/calendar.svg" alt="">
${pad}          </div>
${pad}          <div>
${pad}            <span class="fz-10 gray-text">${publishRowLabel}</span>
${pad}            <${publishRowDateWrap} class="${publishRowDateClass}" dir="ltr">${c.publishDate}</${publishRowDateWrap}>
${pad}          </div>
${pad}        </div>
${pad}        <div class="d-flex align-items-center">
${pad}          <div class="sm-logo">
${pad}            <img src="images/receipt.svg" alt="">
${pad}          </div>
${pad}          <div>
${pad}            <span class="fz-10 gray-text">المتقدمون</span>
${pad}            <div>
${pad}              <span class="black-text fz-12 fw-medium">${applicants}</span>
${pad}            </div>
${pad}          </div>
${pad}        </div>
${pad}      </div>${winnerBlock}
${pad}    </div>
${pad}    <div class="tender-footer">
${pad}      ${detailsBtn}
${pad}    </div>
${pad}  </div>
${pad}</div>`;
}

export function renderListingGrid(cards, opts = {}) {
  const pad = opts.pad ?? '                  ';
  const gridClass = opts.gridClass ?? 'tr-award-card-grid';
  const inner = cards.map((c) => renderListingCard(c, opts)).join('\n');
  return `${pad}<div class="row g-3 ${gridClass}">
${inner}
${pad}</div>`;
}

const listingCardStyleFlags = {
  badgeInHeader: true,
  hideBodyPublishDate: true,
  publishRowAsPublishDate: true,
};

export function mapListingCardStyle(card) {
  return { ...card, ...listingCardStyleFlags };
}

export function mapHistoryStyleListing(card, labels = {}) {
  return {
    ...mapFlowAwardToListing(
      { ...card, headerBadge: card.headerBadge ?? labels.historicalBadge },
      { ...labels, useHistoricalBadgeForRef: true },
    ),
    ...listingCardStyleFlags,
  };
}

export function mapFlowAwardToListing(card, labels = {}) {
  const tags = card.tags || [];
  const applicants = tags.find((t) => /متقدم|شركات/.test(t)) || null;
  const dateTag = tags.find((t) => /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(t));
  let publishDate = dateTag || '';
  if (!publishDate && card.headerPrimaryLabel?.includes('تاريخ')) {
    publishDate = card.headerPrimaryValue;
  } else if (!publishDate && card.headerPrimaryLabel?.includes('سنة')) {
    publishDate = card.headerPrimaryValue;
  } else if (!publishDate && card.update) {
    publishDate = card.update.replace(/\//g, '/');
  }

  let activity = tags.find(
    (t) => t !== applicants && !/\d{1,2}\/\d{1,2}/.test(t) && !/^(مناقصة|منافسة|شراء)/.test(t),
  );
  if (!activity) {
    activity = tags.find((t) => t !== applicants && !/\d{1,2}\/\d{1,2}/.test(t));
  }
  if (!activity) activity = '—';

  let awardValue = null;
  if (card.price) {
    awardValue = String(card.price)
      .replace(/\s*ر\.?\s*س\.?\s*$/u, '')
      .trim();
  }

  let headerBadge = card.headerBadge;
  if (!headerBadge && card.ref && labels.historicalBadge && labels.useHistoricalBadgeForRef) {
    headerBadge = labels.historicalBadge;
  }

  return {
    ref: card.ref || null,
    headerPrimaryLabel: card.headerPrimaryLabel,
    headerPrimaryValue: card.headerPrimaryValue,
    title: card.title,
    dir: card.dir,
    publishDate: publishDate || '—',
    headerBadge: headerBadge || (card.winner ? 'تمت الترسية' : null),
    entity: card.entity,
    activity,
    applicants,
    awardValue,
    winner: card.winner || null,
  };
}
