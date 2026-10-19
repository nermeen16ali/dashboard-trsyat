$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$path = Join-Path (Split-Path $root -Parent) 'tenders-results.html'
$data = Get-Content -LiteralPath (Join-Path $root 'tr-flow-award-cards.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$BUILDING = (Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-icon-building.svg') -Raw -Encoding UTF8).Trim()
$PICK = (Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-icon-pick.svg') -Raw -Encoding UTF8).Trim()

function Format-AwardCardCol {
  param(
    $Card,
    [string]$Pad = '                    '
  )

  $priceBlock = ''
  if ($Card.price) {
    $priceBlock = @"

$Pad                            <div class="tender-price">
$Pad                              <span class="fz-10 d-block mb-1 gray-text">$($data.labels.valueLabel)</span>
$Pad                              <span class="fs-6 fw-medium ff-onest colored">$($Card.price)</span>
$Pad                            </div>
"@
  }

  $statusRow = if ($Card.approved) {
    @"

$Pad                            <div class="d-flex flex-wrap gap-1 mb-2">
$Pad                              <span class="sm-ele fz-10 bordered-8 badge-success">$($data.labels.approvedBadge)</span>
$Pad                              <span class="sm-ele fz-10 bordered-8 prim-opacity-outlined">$($data.labels.updateBadgePrefix) <span
$Pad                                  class="ff-onest">$($Card.update)</span></span>
$Pad                            </div>
"@
  } else {
    @"

$Pad                            <div class="d-flex flex-wrap gap-1 mb-2">
$Pad                              <span class="sm-ele fz-10 bordered-8 prim-opacity-outlined">$($data.labels.updateBadgePrefix) <span
$Pad                                  class="ff-onest">$($Card.update)</span></span>
$Pad                            </div>
"@
  }

  $tagLines = ($Card.tags | ForEach-Object {
    "$Pad                        <span class=`"sm-ele fz-10 bordered-8 prim-opacity-outlined`">$_</span>"
  }) -join "`n"

  $badgeClass = if ($Card.headerBadgeClass) { $Card.headerBadgeClass } else { 'badge-success' }

  return @"
$Pad                  <div class="col-12 col-md-6 col-xl-4">
$Pad                    <article class="tender-card tr-award-card p-3 h-100 d-flex flex-column text-start mb-0">
$Pad                      <div class="tender-header d-flex align-items-start justify-content-between gap-2 mb-2">
$Pad                        <div class="tender-number">
$Pad                          <span class="fz-10 gray-text">$($data.labels.refLabel)</span>
$Pad                          <span class="fz-14 black-text fw-medium ff-onest d-block" dir="ltr"># $($Card.ref)</span>
$Pad                        </div>
$Pad                        <span class="sm-ele fz-10 bordered-8 $badgeClass flex-shrink-0">$($Card.headerBadge)</span>
$Pad                      </div>
$Pad                      <div class="tender-sections p-12 rounded-12 bg-white flex-grow-1">
$Pad                        <div class="tender-section position-relative">
$Pad                          <h6 class="tender-title">$($Card.title)</h6>$priceBlock
$Pad                        </div>
$Pad                        <div class="tender-section tr-award-card__meta position-relative">
$Pad                          <div class="d-flex align-items-start gap-2 mb-2">
$Pad                              $BUILDING
$Pad                              <div class="flex-grow-1 min-w-0">
$Pad                                <span class="fz-10 gray-text d-block">$($data.labels.entityLabel)</span>
$Pad                                <span class="fz-14 black-text">$($Card.entity)</span>
$Pad                              </div>
$Pad                          </div>$statusRow
$Pad                          <div class="d-flex flex-wrap gap-1">
$tagLines
$Pad                          </div>
$Pad                        </div>
$Pad                      </div>
$Pad                      <div class="tender-footer">
$Pad                        <a href="#tr-detail-full"
$Pad                          class="btn-main h-41 btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2">
$Pad                          <span>$($data.labels.pickBtn)</span>
$Pad                          $PICK
$Pad                        </a>
$Pad                      </div>
$Pad                    </article>
$Pad                  </div>
"@
}

function Format-Grid {
  param($Cards, [string]$Pad = '                    ')
  $inner = ($Cards | ForEach-Object { Format-AwardCardCol -Card $_ -Pad $Pad }) -join "`n"
  return @"
$Pad                  <div class="row g-3 tr-award-card-grid">
$inner
$Pad                  </div>
"@
}

# Labels embedded (JSON has no labels key — use tr-latest-awards-labels.json)
$labels = Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-labels.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$data | Add-Member -NotePropertyName labels -NotePropertyValue $labels -Force

$historyGrid = Format-Grid -Cards $data.history
$sectorGrid = Format-Grid -Cards $data.sector
$entityGrid = Format-Grid -Cards $data.entity.cards -Pad $data.entity.pad
$resultsGrid = Format-Grid -Cards $data.results

$text = [IO.File]::ReadAllText($path)

function Replace-Between {
  param([ref]$TextRef, [string]$Start, [string]$End, [string]$New)
  $t = $TextRef.Value
  $i = $t.IndexOf($Start)
  if ($i -lt 0) { throw "Start not found: $Start" }
  $j = $t.IndexOf($End, $i)
  if ($j -lt 0) { throw "End not found: $End" }
  $TextRef.Value = $t.Substring(0, $i) + $New + $t.Substring($j)
}

$tr = [ref]$text

Replace-Between $tr @'
                <div class="tender-card tr-list-item-card bg-white p-3 mb-2">
                  <h6 class="fz-14 black-text fw-medium">تشغيل وصيانة الشبكات والبنية التحتية</h6>
'@ @'
                </div>
              </div>
            </section>
            <section id="tr-sector"
'@ $historyGrid

Replace-Between $tr @'
                <div class="tender-card tr-list-item-card bg-white p-3 mb-2">
                        <div class="tr-list-item-card__head d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <h6 class="fz-14 black-text fw-medium mb-0 flex-grow-1 min-w-0 text-start">تشغيل وصيانة أنظمة تقنية المعلومات</h6>
                          <span class="sm-ele fz-10 bordered-8 text-nowrap badge-success flex-shrink-0">تمت الترسية</span>
                        </div>
'@ @'
                </div>
              </div>
            </section>
            <section id="tr-entity"
'@ $sectorGrid

Replace-Between $tr @'
                      <div class="tender-card tr-list-item-card bg-white p-3 mb-2">
                        <div class="tr-list-item-card__head d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <h6 class="fz-14 black-text fw-medium mb-0 flex-grow-1 min-w-0 text-start">تشغيل وصيانة أنظمة تقنية المعلومات</h6>
                          <span class="sm-ele fz-10 bordered-8 text-nowrap badge-success flex-shrink-0">تمت الترسية</span>
                        </div>
                        <div class="d-flex flex-wrap gap-2 fz-12 text-gray tr-list-item-card__meta">
                          <span>جامعة الملك فيصل</span><span>·</span><span>12/03/2025</span><span>·</span><span>5
                            شركات</span>
                        </div>
'@ @'
                    </div>
                    <div class="tab-pane fade" id="tr-entity-winners"
'@ $entityGrid

Replace-Between $tr @'
                  <div class="tender-card tr-list-item-card bg-white p-3 mb-0">
                    <div class="tr-list-item-card__head d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <h6 class="fz-14 black-text fw-medium mb-0 flex-grow-1 min-w-0 text-start">تشغيل وصيانة أنظمة
                        تقنية المعلومات</h6>
                      <span class="sm-ele fz-10 bordered-8 text-nowrap badge-success flex-shrink-0">تمت الترسية</span>
                    </div>
'@ @'
                </div>
              </div>
            </section>
            <section id="tr-detail"
'@ $resultsGrid

[IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding $false))
Write-Host 'Converted tr-list-item-card blocks to tr-award-card grids.'
