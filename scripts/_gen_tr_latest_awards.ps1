$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding $false
$root = $PSScriptRoot
$cards = Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-cards.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$labels = Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-labels.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$BUILDING = Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-icon-building.svg') -Raw -Encoding UTF8
$PICK_ICON = Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-icon-pick.svg') -Raw -Encoding UTF8

function Get-CardHtml($c) {
  $titleAttr = if ($c.PSObject.Properties.Name -contains 'dir' -and $c.dir) { " dir=`"$($c.dir)`"" } else { '' }
  $priceBlock = if ($c.price) {
@"

                            <div class="tender-price">
                              <span class="fz-10 d-block mb-1 gray-text">$($labels.valueLabel)</span>
                              <span class="fs-6 fw-medium ff-onest">$($c.price) $($labels.currency)</span>
                            </div>
"@
  } else { '' }
  $tagLines = ($c.tags | ForEach-Object { "                        <span class=`"sm-ele fz-10 bordered-8 prim-opacity-outlined`">$_</span>" }) -join "`n"
  return @"
                    <div class="col-12 col-md-6 col-xl-4">
                      <article class="tender-card tr-award-card p-3 h-100 d-flex flex-column text-start mb-0">
                        <div class="tender-header d-flex align-items-start justify-content-between gap-2 mb-2">
                          <div class="tender-number">
                            <span class="fz-10 gray-text">$($labels.refLabel)</span>
                            <span class="fz-14 black-text fw-medium ff-onest d-block" dir="ltr"># $($c.ref)</span>
                          </div>
                          <span class="sm-ele fz-10 bordered-8 badge-success flex-shrink-0">$($labels.historicalBadge)</span>
                        </div>
                        <div class="tender-sections p-12 rounded-12 bg-white flex-grow-1">
                          <div class="tender-section position-relative">
                            <h6 class="tender-title"$titleAttr>$($c.title)</h6>$priceBlock
                          </div>
                          <div class="tender-section tr-award-card__meta position-relative">
                            <div class="d-flex align-items-start gap-2 mb-2">
                              $BUILDING
                              <div class="flex-grow-1 min-w-0">
                                <span class="fz-10 gray-text d-block">$($labels.entityLabel)</span>
                                <span class="fz-14 black-text">$($c.entity)</span>
                              </div>
                            </div>
                            <div class="d-flex flex-wrap gap-1 mb-2">
                              <span class="sm-ele fz-10 bordered-8 badge-success">$($labels.approvedBadge)</span>
                              <span class="sm-ele fz-10 bordered-8 prim-opacity-outlined">$($labels.updateBadgePrefix) <span
                                  class="ff-onest">$($c.update)</span></span>
                            </div>
                            <div class="d-flex flex-wrap gap-1">
$tagLines
                            </div>
                          </div>
                        </div>
                        <div class="tender-footer">
                          <a href="#tr-detail-full"
                            class="btn-main h-41 btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2">
                            <span>$($labels.pickBtn)</span>
                            $PICK_ICON
                          </a>
                        </div>
                      </article>
                    </div>
"@
}

$header = Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-header.html') -Raw -Encoding UTF8
$footer = Get-Content -LiteralPath (Join-Path $root 'tr-latest-awards-footer.html') -Raw -Encoding UTF8

$cardHtml = ($cards | ForEach-Object { Get-CardHtml $_ }) -join "`n"
$out = $header + $cardHtml + "`n                  </div>" + $footer + "`n"

$path = 'd:\dash-pricing\tenders-results.html'
$text = [IO.File]::ReadAllText($path)
$startMarker = '                  <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4 text-start">'
$start = $text.IndexOf($startMarker)
$end = $text.IndexOf('            <section id="tr-top-winners"')
if ($start -lt 0 -or $end -lt 0) { throw "markers not found start=$start end=$end" }
$end = $text.LastIndexOf('            </section>', $end)
if ($end -lt $start) { throw 'section end not found' }
$newText = $text.Substring(0, $start) + $out + "                </div>`r`n              </div>`r`n" + $text.Substring($end)
[IO.File]::WriteAllText($path, $newText, $utf8)
Write-Host 'Updated tr-latest-awards'
