# directus-seed-progress-demo.ps1
# Non-destructive demo progress for testuser-1 so the chat profile preview has
# real data: CSS-Grundlagen fully completed (15/15) + Flexbox started (3/15).
# Idempotent: clears testuser-1's progress for THOSE TWO courses first, then re-adds.
# Other users / courses are untouched.

$ErrorActionPreference = 'Stop'

# --- read .env ---
$envPath = Join-Path $PSScriptRoot '..\.env'
$lines = Get-Content $envPath
$url   = (($lines | Where-Object { $_ -match '^DIRECTUS_URL=' })   -split '=', 2)[1].Trim()
$token = (($lines | Where-Object { $_ -match '^DIRECTUS_TOKEN=' }) -split '=', 2)[1].Trim()
$h = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

function Get-ErrBody { param($err) if ($err.ErrorDetails -and $err.ErrorDetails.Message) { return $err.ErrorDetails.Message }; return $err.Exception.Message }

function Invoke-Directus {
  param([string]$uri, [string]$method = 'Get', $bodyJson = $null)
  for ($try = 1; $try -le 10; $try++) {
    try {
      if ($bodyJson) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
        return Invoke-RestMethod $uri -Method $method -Headers $h -Body $bytes -ContentType 'application/json; charset=utf-8'
      } else { return Invoke-RestMethod $uri -Method $method -Headers $h }
    } catch {
      $b = Get-ErrBody $_
      if (($b -match 'FORBIDDEN' -or $b -match 'SERVICE_UNAVAILABLE' -or $b -match '"code":"INTERNAL') -and $try -lt 10) { Start-Sleep -Milliseconds (400 * $try); continue }
      throw
    }
  }
}

function Get-CourseId { param($slug) (Invoke-Directus "$url/items/cascade_courses?filter[slug][_eq]=$slug&fields=id&limit=1").data[0].id }

# --- testuser-1 ---
$userId = (Invoke-Directus "$url/items/cascade_users?filter[username][_eq]=testuser-1&fields=id&limit=1").data[0].id
if (-not $userId) { throw "testuser-1 not found" }

$cssId  = Get-CourseId 'css-grundlagen'
$flexId = Get-CourseId 'flexbox-layout'

# --- clear this user's progress for the two target courses (idempotent) ---
foreach ($cid in @($cssId, $flexId)) {
  $rows = Invoke-Directus "$url/items/cascade_progress?filter[user][_eq]=$userId&filter[course][_eq]=$cid&fields=id&limit=-1"
  $ids = @($rows.data | ForEach-Object { $_.id })
  if ($ids.Count -gt 0) { Invoke-Directus "$url/items/cascade_progress" 'Delete' (ConvertTo-Json $ids) | Out-Null }
}

function Add-Done {
  param($courseId, [int]$count)
  $lessons = (Invoke-Directus "$url/items/cascade_lessons?filter[course][_eq]=$courseId&fields=id,sort&sort=sort&limit=-1").data
  $now = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
  $n = 0
  foreach ($l in ($lessons | Select-Object -First $count)) {
    $body = ConvertTo-Json @{ user=$userId; lesson=$l.id; course=$courseId; status='done'; completed_at=$now }
    Invoke-Directus "$url/items/cascade_progress" 'Post' $body | Out-Null
    $n++
  }
  return $n
}

$cssTotal = (Invoke-Directus "$url/items/cascade_lessons?filter[course][_eq]=$cssId&fields=id&limit=-1").data.Count
$cssDone  = Add-Done $cssId $cssTotal      # complete all
$flexDone = Add-Done $flexId 3             # start (3 lessons)

Write-Host "testuser-1 (id $userId):"
Write-Host "  CSS-Grundlagen: $cssDone / $cssTotal done (abgeschlossen)"
Write-Host "  Flexbox:        $flexDone done (begonnen)"
Write-Host "done"
