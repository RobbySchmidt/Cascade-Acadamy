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

# --- courses ---
$cGrund = New-Item 'cascade_courses' @{
  title='CSS-Grundlagen'; slug='css-grundlagen'; level='Anfänger'; status='active'; sort=1
  description='Von Selektoren bis Box-Modell: die Basics, mit denen du jede Webseite stylen kannst.'
}
$cFlex = New-Item 'cascade_courses' @{
  title='Flexbox & Layout'; slug='flexbox-layout'; level='Mittel'; status='locked'; sort=2
  unlock_hint='Schließe CSS-Grundlagen ab'; description='Moderne Layouts mit Flexbox.'
}
$cAnim = New-Item 'cascade_courses' @{
  title='Animationen'; slug='animationen'; level='Fortgeschritten'; status='locked'; sort=3
  unlock_hint='Bald verfügbar'; description='Bewegung und Übergänge mit CSS.'
}
$grundId = $cGrund.id
Write-Host "courses: $grundId, $($cFlex.id), $($cAnim.id)"

# --- chapters (under css-grundlagen) ---
$chapterMap = @{}
$chapterDefs = @(
  @{ title='Selektoren & Grundlagen'; sort=1 },
  @{ title='Text & Schrift';          sort=2 },
  @{ title='Box-Modell';              sort=3 },
  @{ title='Hintergrund & Abschluss'; sort=4 }
)
foreach ($cd in $chapterDefs) {
  $ch = New-Item 'cascade_chapters' @{ course=$grundId; title=$cd.title; sort=$cd.sort }
  $chapterMap[$cd.title] = $ch.id
}
Write-Host "chapters: $($chapterMap.Values -join ', ')"

# --- lessons (from lessons.json) ---
$lessonsPath = Join-Path $PSScriptRoot 'lessons.json'
# Read explicitly as UTF-8 so German umlauts in the lesson content stay intact.
$lessons = [System.IO.File]::ReadAllText($lessonsPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$lessonIdBySort = @{}
foreach ($l in $lessons) {
  $chId = $chapterMap[$l.chapter]
  if (-not $chId) { throw "No chapter id for '$($l.chapter)'" }
  $obj = @{
    chapter     = $chId
    course      = $grundId
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
  $row = New-Item 'cascade_lessons' $obj
  $lessonIdBySort[[int]$l.sort] = $row.id
}
Write-Host "lessons inserted: $($lessonIdBySort.Count)"

# --- sample progress for testuser-1: lessons sort 1..5 ---
$now = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
$progressCount = 0
foreach ($s in 1,2,3,4,5) {
  $lid = $lessonIdBySort[$s]
  New-Item 'cascade_progress' @{
    user=$user1.id; lesson=$lid; course=$grundId; status='done'; completed_at=$now
  } | Out-Null
  $progressCount++
}

Write-Host "----"
Write-Host "users:    2"
Write-Host "courses:  3"
Write-Host "chapters: $($chapterMap.Count)"
Write-Host "lessons:  $($lessonIdBySort.Count)"
Write-Host "progress: $progressCount"
Write-Host "seed done"
