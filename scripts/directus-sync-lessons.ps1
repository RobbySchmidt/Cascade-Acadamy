# directus-sync-lessons.ps1
# Idempotent: syncs the content fields (task, html, css_starter, solution, hint,
# assertions) of each cascade_lessons row from scripts/lessons.json, matched by
# `sort`. Does NOT touch chapter/course linkage, sort, users or progress — so no
# re-seed is needed and learner progress stays intact.

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
      if ($transient -and $try -lt $maxTries) {
        Start-Sleep -Milliseconds (400 * $try)
        continue
      }
      throw
    }
  }
}

# --- load lessons.json (UTF-8 so umlauts stay intact) ---
$lessonsPath = Join-Path $PSScriptRoot 'lessons.json'
$lessons = [System.IO.File]::ReadAllText($lessonsPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$bySort = @{}
foreach ($l in $lessons) { $bySort[[int]$l.sort] = $l }

# --- fetch existing lesson ids by sort, patch content fields ---
$existing = Invoke-Directus "$url/items/cascade_lessons?fields=id,sort,title&sort=sort&limit=-1"
$updated = 0
foreach ($row in $existing.data) {
  $sort = [int]$row.sort
  if (-not $bySort.ContainsKey($sort)) { continue }
  $l = $bySort[$sort]
  $patch = @{
    task        = $l.task
    html        = $l.html
    css_starter = $l.css_starter
    solution    = $l.solution
    hint        = $l.hint
    assertions  = $l.assertions
  }
  $body = ConvertTo-Json $patch -Depth 20
  Invoke-Directus "$url/items/cascade_lessons/$($row.id)" 'Patch' $body | Out-Null
  Write-Host ("synced #{0,2} {1}" -f $sort, $row.title)
  $updated++
}

Write-Host "----"
Write-Host "lessons synced: $updated"
