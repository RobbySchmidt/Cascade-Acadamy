# directus-add-courses.ps1
# Non-destructive: creates/updates the Flexbox, CSS Grid and Animationen courses
# (metadata + chapters + lessons) from courses.json and the per-course lesson
# files. Only these three courses are touched (scoped wipe + reinsert of their
# chapters/lessons). CSS-Grundlagen, its lessons and ALL learner progress for it
# stay untouched — no full re-seed. Idempotent: safe to re-run.

$ErrorActionPreference = 'Stop'

$targets = @('flexbox-layout', 'css-grid', 'animationen')

# --- read .env ---
$envPath = Join-Path $PSScriptRoot '..\.env'
$lines = Get-Content $envPath
$url   = (($lines | Where-Object { $_ -match '^DIRECTUS_URL=' })   -split '=', 2)[1].Trim()
$token = (($lines | Where-Object { $_ -match '^DIRECTUS_TOKEN=' }) -split '=', 2)[1].Trim()
$h = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

function Get-ErrBody {
  param($err)
  if ($err.ErrorDetails -and $err.ErrorDetails.Message) { return $err.ErrorDetails.Message }
  return $err.Exception.Message
}

function Invoke-Directus {
  param([string]$uri, [string]$method = 'Get', $bodyJson = $null)
  $maxTries = 10
  for ($try = 1; $try -le $maxTries; $try++) {
    try {
      if ($bodyJson) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
        return Invoke-RestMethod $uri -Method $method -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8'
      } else {
        return Invoke-RestMethod $uri -Method $method -Headers $h
      }
    } catch {
      $b = Get-ErrBody $_
      $transient = ($b -match 'FORBIDDEN' -or $b -match "don't have permission" -or $b -match 'SERVICE_UNAVAILABLE' -or $b -match '"code":"INTERNAL')
      if ($transient -and $try -lt $maxTries) { Start-Sleep -Milliseconds (400 * $try); continue }
      throw
    }
  }
}

function New-Row {
  param([string]$col, $obj)
  $body = ConvertTo-Json $obj -Depth 20
  (Invoke-Directus "$url/items/$col" 'Post' $body).data
}

function Clear-ByCourse {
  param([string]$col, $courseId)
  $resp = Invoke-Directus "$url/items/${col}?filter[course][_eq]=$courseId&fields=id&limit=-1"
  $ids = @($resp.data | ForEach-Object { $_.id })
  if ($ids.Count -gt 0) {
    Invoke-Directus "$url/items/$col" 'Delete' (ConvertTo-Json $ids) | Out-Null
  }
}

# --- load metadata ---
$courses = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'courses.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json

foreach ($slug in $targets) {
  $cdef = $courses | Where-Object { $_.slug -eq $slug }
  if (-not $cdef) { throw "No course def for slug '$slug' in courses.json" }

  # --- ensure course exists + metadata up to date ---
  $found = Invoke-Directus "$url/items/cascade_courses?filter[slug][_eq]=$slug&fields=id&limit=1"
  $meta = @{
    title       = $cdef.title
    slug        = $cdef.slug
    level       = $cdef.level
    status      = $cdef.status
    sort        = $cdef.sort
    description  = $cdef.description
    unlock_hint = $null
  }
  if ($found.data.Count -gt 0) {
    $courseId = $found.data[0].id
    $body = ConvertTo-Json $meta -Depth 10
    Invoke-Directus "$url/items/cascade_courses/$courseId" 'Patch' $body | Out-Null
    Write-Host "course '$slug' updated (id $courseId)"
  } else {
    $row = New-Row 'cascade_courses' $meta
    $courseId = $row.id
    Write-Host "course '$slug' created (id $courseId)"
  }

  # --- scoped wipe (FK-safe): progress -> lessons -> chapters for THIS course ---
  Clear-ByCourse 'cascade_progress' $courseId
  Clear-ByCourse 'cascade_lessons'  $courseId
  Clear-ByCourse 'cascade_chapters' $courseId

  # --- chapters: ordered by first appearance in the lessons file ---
  $lessonsPath = Join-Path $PSScriptRoot $cdef.lessonsFile
  $lessons = [System.IO.File]::ReadAllText($lessonsPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
  $chapterMap = @{}
  $chapterSort = 1
  foreach ($l in $lessons) {
    if (-not $chapterMap.ContainsKey($l.chapter)) {
      $ch = New-Row 'cascade_chapters' @{ course = $courseId; title = $l.chapter; sort = $chapterSort }
      $chapterMap[$l.chapter] = $ch.id
      $chapterSort++
    }
  }

  # --- lessons ---
  foreach ($l in $lessons) {
    New-Row 'cascade_lessons' @{
      chapter     = $chapterMap[$l.chapter]
      course      = $courseId
      title       = $l.title
      type        = $l.type
      task        = $l.task
      html        = $l.html
      css_starter = $l.css_starter
      solution    = $l.solution
      hint        = $l.hint
      assertions  = $l.assertions
      sort        = $l.sort
    } | Out-Null
  }
  Write-Host ("  -> {0} chapters, {1} lessons" -f $chapterMap.Count, $lessons.Count)
}

Write-Host "----"
Write-Host "done: $($targets.Count) courses ensured"
