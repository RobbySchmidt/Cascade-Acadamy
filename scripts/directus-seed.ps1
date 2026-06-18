# directus-seed.ps1
# Idempotent seeding: wipes cascade_* item tables (FK-safe order) then reinserts
# users, courses, chapters, lessons (from scripts/lessons.json) and sample progress.

$ErrorActionPreference = 'Stop'

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

# Directus on this host returns transient FORBIDDEN right after schema changes
# (permissions/schema cache convergence). Retry such calls with backoff.
function Invoke-Directus {
  param([string]$uri, [string]$method = 'Get', $bodyJson = $null)
  $maxTries = 10
  for ($try = 1; $try -le $maxTries; $try++) {
    try {
      if ($bodyJson) {
        # Send as UTF-8 bytes so German umlauts (ä ö ü ß) are not corrupted/truncated.
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
        return Invoke-RestMethod $uri -Method $method -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8'
      } else {
        return Invoke-RestMethod $uri -Method $method -Headers $h
      }
    } catch {
      $b = Get-ErrBody $_
      $transient =($b -match 'FORBIDDEN' -or $b -match "don't have permission" -or $b -match 'SERVICE_UNAVAILABLE' -or $b -match '"code":"INTERNAL')
      if ($transient -and $try -lt $maxTries) {
        Start-Sleep -Milliseconds (400 * $try)
        continue
      }
      throw
    }
  }
}

function Clear-Collection {
  param([string]$col)
  $resp = Invoke-Directus "$url/items/${col}?limit=-1&fields=id"
  $ids = @($resp.data | ForEach-Object { $_.id })
  if ($ids.Count -gt 0) {
    $body = ConvertTo-Json $ids
    Invoke-Directus "$url/items/${col}" 'Delete' $body | Out-Null
  }
  Write-Host "cleared $col ($($ids.Count) rows)"
}

function New-Item {
  param([string]$col, $obj)
  $body = ConvertTo-Json $obj -Depth 20
  try {
    $resp = Invoke-Directus "$url/items/$col" 'Post' $body
    return $resp.data
  } catch {
    Write-Host "ERROR inserting into $col"
    Write-Host (Get-ErrBody $_)
    throw
  }
}

# --- wipe in FK-safe order ---
Clear-Collection 'cascade_progress'
Clear-Collection 'cascade_lessons'
Clear-Collection 'cascade_chapters'
Clear-Collection 'cascade_courses'
Clear-Collection 'cascade_users'

# --- users ---
$user1 = New-Item 'cascade_users' @{
  username        = 'testuser-1'
  email           = 'testuser-1@cascade.local'
  display_name    = 'Mara K.'
  avatar_initials = 'MK'
  password        = 'test1234'
  streak          = 5
  started_at      = (Get-Date).AddDays(-12).ToString('yyyy-MM-dd')
}
$user2 = New-Item 'cascade_users' @{
  username        = 'testuser-2'
  email           = 'testuser-2@cascade.local'
  display_name    = 'Tom B.'
  avatar_initials = 'TB'
  password        = 'test1234'
  streak          = 0
  started_at      = (Get-Date).AddDays(-3).ToString('yyyy-MM-dd')
}
Write-Host "users: $($user1.id), $($user2.id)"

# --- courses, chapters & lessons (from courses.json + per-course lesson files) ---
$courseDefs = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'courses.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$courseIdBySlug   = @{}
$cssLessonIdBySort = @{}   # only needed for the CSS-Grundlagen sample progress
$totalChapters = 0
$totalLessons  = 0

foreach ($cdef in $courseDefs) {
  $course = New-Item 'cascade_courses' @{
    title       = $cdef.title
    slug        = $cdef.slug
    level       = $cdef.level
    status      = $cdef.status
    sort        = $cdef.sort
    description = $cdef.description
  }
  $courseIdBySlug[$cdef.slug] = $course.id

  # Read lessons (UTF-8 so German umlauts stay intact); chapters in first-seen order.
  $lessons = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot $cdef.lessonsFile), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
  $chapterMap = @{}
  $chapterSort = 1
  foreach ($l in $lessons) {
    if (-not $chapterMap.ContainsKey($l.chapter)) {
      $ch = New-Item 'cascade_chapters' @{ course=$course.id; title=$l.chapter; sort=$chapterSort }
      $chapterMap[$l.chapter] = $ch.id
      $chapterSort++
      $totalChapters++
    }
  }
  foreach ($l in $lessons) {
    $row = New-Item 'cascade_lessons' @{
      chapter     = $chapterMap[$l.chapter]
      course      = $course.id
      title       = $l.title
      type        = $l.type
      task        = $l.task
      html        = $l.html
      css_starter = $l.css_starter
      solution    = $l.solution
      hint        = $l.hint
      assertions  = $l.assertions   # stays a JSON array via ConvertTo-Json -Depth
      sort        = $l.sort
    }
    if ($cdef.slug -eq 'css-grundlagen') { $cssLessonIdBySort[[int]$l.sort] = $row.id }
    $totalLessons++
  }
  Write-Host ("course '{0}': {1} chapters, {2} lessons" -f $cdef.slug, $chapterMap.Count, $lessons.Count)
}

# --- sample progress for testuser-1: CSS-Grundlagen lessons sort 1..5 ---
$now = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
$grundId = $courseIdBySlug['css-grundlagen']
$progressCount = 0
foreach ($s in 1,2,3,4,5) {
  New-Item 'cascade_progress' @{
    user=$user1.id; lesson=$cssLessonIdBySort[$s]; course=$grundId; status='done'; completed_at=$now
  } | Out-Null
  $progressCount++
}

Write-Host "----"
Write-Host "users:    2"
Write-Host "courses:  $($courseDefs.Count)"
Write-Host "chapters: $totalChapters"
Write-Host "lessons:  $totalLessons"
Write-Host "progress: $progressCount"
Write-Host "seed done"
