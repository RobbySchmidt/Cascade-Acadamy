# directus-schema.ps1
# Idempotent creation of cascade_* collections, fields and relations.
# Safe to re-run: existing collections/fields/relations are skipped on 409/duplicate.

$ErrorActionPreference = 'Stop'

# --- read .env ---
$envPath = Join-Path $PSScriptRoot '..\.env'
$lines = Get-Content $envPath
$url   = (($lines | Where-Object { $_ -match '^DIRECTUS_URL=' })   -split '=', 2)[1].Trim()
$token = (($lines | Where-Object { $_ -match '^DIRECTUS_TOKEN=' }) -split '=', 2)[1].Trim()
$h = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

function Get-ErrBody {
  param($err)
  # PowerShell 5.1 puts the raw HTTP response body here for Invoke-RestMethod failures.
  if ($err.ErrorDetails -and $err.ErrorDetails.Message) {
    return $err.ErrorDetails.Message
  }
  try {
    $resp = $err.Exception.Response
    if ($resp) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      return $reader.ReadToEnd()
    }
  } catch {}
  return $err.Exception.Message
}

function Test-Exists {
  param([string]$body, $err)
  $code = $null
  try { $code = $err.Exception.Response.StatusCode.value__ } catch {}
  return ($code -eq 409 -or $body -match 'already exists' -or $body -match 'RECORD_NOT_UNIQUE' -or $body -match 'duplicate' -or $body -match 'already has an associated relationship')
}

function New-Collection {
  param([string]$name, [array]$fields)
  $body = @{
    collection = $name
    schema     = @{}
    meta       = @{ icon = 'school' }
    fields     = $fields
  } | ConvertTo-Json -Depth 10
  try {
    Invoke-RestMethod "$url/collections" -Method Post -Headers $h -Body $body | Out-Null
    Write-Host "created collection $name"
  } catch {
    $b = Get-ErrBody $_
    if (Test-Exists $b $_) {
      Write-Host "skip collection $name (exists)"
    } else {
      Write-Host "ERROR creating collection $name"
      Write-Host $b
      throw
    }
  }
}

function New-Relation {
  param([string]$child, [string]$field, [string]$parent)
  $body = @{
    collection        = $child
    field             = $field
    related_collection = $parent
    meta              = @{}
    schema            = @{}
  } | ConvertTo-Json -Depth 10
  try {
    Invoke-RestMethod "$url/relations" -Method Post -Headers $h -Body $body | Out-Null
    Write-Host "created relation $child.$field -> $parent"
  } catch {
    $b = Get-ErrBody $_
    if (Test-Exists $b $_) {
      Write-Host "skip relation $child.$field (exists)"
    } else {
      Write-Host "ERROR creating relation $child.$field -> $parent"
      Write-Host $b
      throw
    }
  }
}

# --- field helpers ---
function PK {
  @{ field='id'; type='integer';
     meta=@{ hidden=$true; interface='input'; readonly=$true };
     schema=@{ is_primary_key=$true; has_auto_increment=$true } }
}
function StrField  { param($f, $iface='input')        @{ field=$f; type='string';  meta=@{ interface=$iface } } }
function TextField { param($f, $iface='input-rich-text-html') @{ field=$f; type='text'; meta=@{ interface=$iface } } }
function IntField  { param($f)                        @{ field=$f; type='integer'; meta=@{ interface='input' } } }
function DateField { param($f)                        @{ field=$f; type='date';    meta=@{ interface='datetime' } } }
function TsField   { param($f)                        @{ field=$f; type='timestamp'; meta=@{ interface='datetime' } } }
function JsonField { param($f)                        @{ field=$f; type='json';    meta=@{ interface='input-code' } } }
function FkField   { param($f)                        @{ field=$f; type='integer'; meta=@{ interface='select-dropdown-m2o' } } }

# --- cascade_users ---
New-Collection 'cascade_users' @(
  (PK),
  (StrField 'username'),
  (StrField 'email'),
  (StrField 'display_name'),
  (StrField 'avatar_initials'),
  (StrField 'password'),
  (IntField 'streak'),
  (DateField 'started_at')
)

# --- cascade_courses ---
New-Collection 'cascade_courses' @(
  (PK),
  (StrField 'title'),
  (StrField 'slug'),
  (StrField 'level' 'select-dropdown'),
  (TextField 'description' 'input-multiline'),
  (StrField 'status' 'select-dropdown'),
  (StrField 'unlock_hint'),
  (IntField 'sort')
)

# --- cascade_chapters (FK: course) ---
New-Collection 'cascade_chapters' @(
  (PK),
  (FkField 'course'),
  (StrField 'title'),
  (IntField 'sort')
)

# --- cascade_lessons (FK: chapter, course) ---
New-Collection 'cascade_lessons' @(
  (PK),
  (FkField 'chapter'),
  (FkField 'course'),
  (StrField 'title'),
  (StrField 'type' 'select-dropdown'),
  (TextField 'task' 'input-multiline'),
  (TextField 'html'),
  (TextField 'css_starter'),
  (TextField 'solution'),
  (TextField 'hint' 'input-multiline'),
  (JsonField 'assertions'),
  (IntField 'sort')
)

# --- cascade_progress (FK: user, lesson, course) ---
New-Collection 'cascade_progress' @(
  (PK),
  (FkField 'user'),
  (FkField 'lesson'),
  (FkField 'course'),
  (StrField 'status' 'select-dropdown'),
  (TsField 'completed_at')
)

# --- relations (M2O) ---
New-Relation 'cascade_chapters' 'course'  'cascade_courses'
New-Relation 'cascade_lessons'  'chapter' 'cascade_chapters'
New-Relation 'cascade_lessons'  'course'  'cascade_courses'
New-Relation 'cascade_progress' 'user'    'cascade_users'
New-Relation 'cascade_progress' 'lesson'  'cascade_lessons'
New-Relation 'cascade_progress' 'course'  'cascade_courses'

Write-Host "schema done"
