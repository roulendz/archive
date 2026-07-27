<#
.SYNOPSIS
    Scans media volumes and merges newly found recordings into the archive catalog.

.DESCRIPTION
    Rebuilds archive.json from a source volume without losing hand-curated data.

    Three things happen on every run:
      1. New recordings found on disk are appended as new records.
      2. Catalog records that have no file yet (title + date only, typed up from
         the old cassette lists) are linked to a matching file when one is found.
      3. Existing records keep their id, title and author - the scanner never
         overwrites curated text with a filename-derived guess.

    Emitted paths are volume-relative on purpose. Absolute paths such as
    "E:\TomaBlueHDD\SAT AUDIO\..." are published to the open web by the site and
    leak the operator's local disk layout, so they are reduced to
    { volume, path } where path starts at the volume root.

.PARAMETER Root
    One or more directories to scan. Defaults to E:\.

.PARAMETER Volume
    Logical name recorded on each new record, e.g. "SAT-E". Identifies which
    physical disk holds the file after drive letters inevitably change.

.PARAMETER ExistingJson
    Catalog to merge into. Omit to build a catalog from scratch.

.PARAMETER OutputJson
    Where to write the merged catalog.

.PARAMETER SkipDuration
    Skip reading audio durations. Much faster; useful for a dry run.

.PARAMETER IncludeVideo
    Also index video containers (mp4, mkv, mov, flv, wmv, m4v).

.EXAMPLE
    .\Build-Archive.ps1 -Root 'E:\' -Volume 'SAT-E' `
        -ExistingJson ..\archive_20250322_184450.json -OutputJson ..\archive.json
#>
[CmdletBinding()]
param(
    [string[]] $Root = @('E:\'),
    [string]   $Volume = 'SAT-E',
    [string]   $ExistingJson,
    [string]   $OutputJson = 'archive.json',
    [switch]   $SkipDuration,
    [switch]   $IncludeVideo
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$AudioExt = @('.mp3', '.wav', '.wma', '.m4a', '.aac', '.flac', '.ogg', '.amr')
$VideoExt = @('.mp4', '.mkv', '.mov', '.flv', '.wmv', '.m4v')
$MediaExt = if ($IncludeVideo) { $AudioExt + $VideoExt } else { $AudioExt }

# Directories that hold editing scratch, stock music and OS noise rather than
# recordings of services. Matched against the full path.
$ExcludeDir = @(
    '\$RECYCLE\.BIN\\'
    '\\System Volume Information\\'
    '\\Imported Files\\'
    '\\Adobe\\'
    '\\Skech\\'
    '\\Phonogram\\'
    '\\\.git\\'
)

# Filenames that are never a sermon.
$ExcludeFile = @(
    '^tests?\.'
    '^Untitled'
    'Sound Effect'
    'Non Copyrighted'
    '\(320\s+kbps\)'
    'crying baby'
    'National Anthem'
)

# Working folders and filename suffixes left behind by the encoding workflow.
# A file sitting in one of these is a re-encode of a sibling, not a separate
# recording, so it loses to the original during de-duplication.
$DerivativeDir  = '(?i)(^|\\)(master|compressed|converted)[^\\]*(\\|$)'
$DerivativeFile = '(?i)\((master|mater|converted|compressed)\)'

# Encoder and workflow noise stripped from titles.
$TitleNoise = @(
    '\(master\)_?\d*'
    '\(mater\)'
    '\(converted\)'
    '\(compressed\)'
    '\(Partial\)'
    '\(\d+\s*kbps\)'
    '\bCopy\b'
    '_0$'
    '\s+\(\d+\)$'
)

# The same speakers were typed a dozen different ways over 25 years. Map the
# spellings onto one canonical form so author filtering actually works.
$AuthorCanon = [ordered]@{
    '^(ps|mac|mācītājs|māc|pastor)?\.?\s*rufus(\s+ad[zž]iboi?je)?$' = 'Ps. Rufus Adžiboije'
    '^(ps|ap)?\.?\s*randy$'                                        = 'Ps. Randy'
    '^(ap)?\.?\s*(tofs|toffs|tuff)$'                               = 'Ap. Tofs'
    '^rev\.?\s*john\s+bon?ey$'                                     = 'Rev. John Boney'
    '^(ps)?\.?\s*evans\s+osemwegie$'                               = 'Evans Osemwegie'
    '^daina(\s+egl[iī]te)?$'                                       = 'Daina Eglīte'
    '^(pr)?\.?\s*davids$'                                          = 'Pr. Davids'
    '^(ps)?\.?\s*moses$'                                           = 'Ps. Moses'
}

# Legacy records store absolute paths from whatever drive letter Windows handed
# out on the day they were indexed, and those letters have already shifted once.
# Each prefix maps to a stable volume name plus a volume-relative path, so the
# published catalog never contains a drive letter and survives the next reshuffle.
#
# Verified against the current disk: "E:\TomaBlueHDD\" and "H:\" are both this
# volume - 2,762 of their paths resolve under E:\ today. "F:\" and "G:\" are
# separate disks; re-run this script with -Root pointed at them when they are
# attached to confirm and enrich those records.
$VolumeMap = [ordered]@{
    '^E:\\TomaBlueHDD\\' = 'SAT-E'
    '^H:\\'              = 'SAT-E'
    '^F:\\'              = 'SAT-F'
    '^G:\\'              = 'SAT-G'
    '^E:\\'              = 'SAT-E2024'
}

# Latvian and English month abbreviations used in folder and file names.
$MonthNames = @{
    'jan' = 1; 'feb' = 2; 'mar' = 3; 'apr' = 4; 'mai' = 5; 'may' = 5
    'jun' = 6; 'jul' = 7; 'aug' = 8; 'sep' = 9; 'okt' = 10; 'oct' = 10
    'nov' = 11; 'dec' = 12
}

function Test-Excluded {
    param([string] $FullName, [string] $Name)
    foreach ($p in $ExcludeDir) { if ($FullName -match $p) { return $true } }
    foreach ($p in $ExcludeFile) { if ($Name -match $p) { return $true } }
    return $false
}

function ConvertTo-Date {
    <#
        Pulls a date out of a file or folder name. Returns $null when the name
        carries no date - many cassette teachings are undated series and that is
        a legitimate outcome, not a failure.
    #>
    param([string] $Text)

    $t = $Text

    # 12.-13.04.2002 - a recording spanning two days; take the first.
    if ($t -match '^(\d{1,2})\.?\s*-\s*\d{1,2}\.(\d{1,2})\.(\d{4})') {
        return Get-SafeDate ([int]$Matches[3]) ([int]$Matches[2]) ([int]$Matches[1])
    }
    # 2017-Aug-24 / 2018-Okt-29
    if ($t -match '(\d{4})[-_\s]+([A-Za-zĀ-ž]{3})[a-zĀ-ž]*[-_\s]+(\d{1,2})') {
        $m = $MonthNames[$Matches[2].ToLower()]
        if ($m) { return Get-SafeDate ([int]$Matches[1]) $m ([int]$Matches[3]) }
    }
    # 2020-01-05 / 2010-11-7 / 2012--12-16 (stray repeated separators are common)
    if ($t -match '(?<!\d)(\d{4})[-_.,]+\s*(\d{1,2})[-_.,]+\s*(\d{1,2})(?!\d)') {
        return Get-SafeDate ([int]$Matches[1]) ([int]$Matches[2]) ([int]$Matches[3])
    }
    # 15-01-2006 / 01.02.2004 / 13.12. 2001 / 27.10.2012 / 28,06,2001
    if ($t -match '(?<!\d)(\d{1,2})[-_.,]+\s*(\d{1,2})[-_.,]+\s*(\d{4})(?!\d)') {
        return Get-SafeDate ([int]$Matches[3]) ([int]$Matches[2]) ([int]$Matches[1])
    }
    # 09.10.05 - two digit year. Anything <= 30 is 20xx, the archive starts 1996.
    if ($t -match '(?<!\d)(\d{2})\.(\d{2})\.(\d{2})(?!\d)') {
        $yy = [int]$Matches[3]
        $year = if ($yy -le 30) { 2000 + $yy } else { 1900 + $yy }
        return Get-SafeDate $year ([int]$Matches[2]) ([int]$Matches[1])
    }
    return $null
}

function Get-SafeDate {
    param([int] $Year, [int] $Month, [int] $Day)
    if ($Year -lt 1990 -or $Year -gt 2100) { return $null }
    if ($Month -lt 1 -or $Month -gt 12) { return $null }
    if ($Day -lt 1 -or $Day -gt 31) { return $null }
    try { return [datetime]::new($Year, $Month, $Day) } catch { return $null }
}

function Get-CleanTitle {
    param([string] $BaseName)

    $t = $BaseName

    # Drop the date wherever it sits - most names lead with it, but some trail
    # it ("youth 27.10.2012") - along with the separator glued to it.
    $t = $t -replace '\d{1,2}\.?\s*-\s*\d{1,2}\.\d{1,2}\.\d{4}\.?[_\s-]*', ' '
    $t = $t -replace '\d{4}[-_.\s]+[A-Za-zĀ-ž]{3,}[-_.\s]+\d{1,2}[_\s-]*', ' '
    $t = $t -replace '(?<!\d)\d{4}[-_.,]+\s*\d{1,2}[-_.,]+\s*\d{1,2}(?!\d)[.,]?[_\s-]*', ' '
    $t = $t -replace '(?<!\d)\d{1,2}[-_.,]+\s*\d{1,2}[-_.,]+\s*\d{2,4}(?!\d)[.,]?[_\s-]*', ' '

    foreach ($p in $TitleNoise) { $t = $t -replace $p, ' ' }

    $t = $t -replace '_', ' '
    $t = $t -replace '\s{2,}', ' '
    $t = $t.Trim(' ', '.', '-', '_')

    if (-not $t) { $t = $BaseName }
    return $t
}

function Get-Author {
    <#
        Recognises a speaker named inside a filename, e.g.
        "2020-01-05_Ps Rufus Adziboije_Debesu Valstibas Pelna1.daļa".
        Returns '' rather than guessing when no known name is present.
    #>
    param([string] $Text)

    # Underscore is a word character, so \b never fires in "..._Ps Rufus_..."
    # and the speaker goes unrecognised. Flatten separators to spaces first.
    $Text = $Text -replace '[_\.]+', ' '

    # Case-sensitive throughout: PowerShell's -match is case-insensitive by
    # default, which turns "Prayer p1" into the speaker "Pr. Ayer". The
    # honorific must also be a whole token, so "Prayer" cannot supply "Pr".
    $patterns = @(
        '\b((?:Ps|Ap|Rev|Pr|M[āa]c)\.?\s+[A-ZĀ-Ž][a-zā-ž]+(?:\s+Ad[zž]iboi?je)?)\b'
        '\b((?:Ps|Ap|Rev|Pr|M[āa]c)\.\s*[A-ZĀ-Ž][a-zā-ž]+(?:\s+Ad[zž]iboi?je)?)\b'
        '\b(Evans\s+Osemwegie)\b'
        '\b(Daina(?:\s+Egl[iī]te)?)\b'
    )
    foreach ($p in $patterns) {
        if ($Text -cmatch $p) { return (Get-CanonAuthor $Matches[1]) }
    }
    return ''
}

function Get-CanonAuthor {
    param([string] $Raw)
    $n = ($Raw -replace '\s+', ' ').Trim()
    if (-not $n) { return '' }
    foreach ($p in $AuthorCanon.Keys) {
        if ($n -match $p) { return $AuthorCanon[$p] }
    }
    return $n
}

function Get-NormalizedKey {
    <#
        Collapses a title to a comparison key: diacritics folded, punctuation
        gone. "Plēsīgie putni " and "Plesigie putni" produce the same key.
    #>
    param([string] $Title)

    $s = $Title.ToLowerInvariant()
    $s = $s.Normalize([Text.NormalizationForm]::FormD)
    $sb = [Text.StringBuilder]::new()
    foreach ($c in $s.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne 'NonSpacingMark') {
            [void]$sb.Append($c)
        }
    }
    $s = $sb.ToString()
    $s = $s -replace '[^a-z0-9]', ''
    return $s
}

function Get-Prop {
    # Strict mode makes a missing property a terminating error, and these
    # records come from JSON with wildly inconsistent shapes.
    param($Object, [string] $Name)
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { return $p.Value }
    return $null
}

function ConvertTo-RelativePath {
    <#
        Splits "H:\SAT AUDIO 2014\x.mp3" into a volume name and a
        volume-relative path. Returns $null when the value is already relative.
    #>
    param([string] $AbsolutePath)

    if (-not $AbsolutePath -or $AbsolutePath -notmatch '^[A-Za-z]:\\') { return $null }
    foreach ($prefix in $VolumeMap.Keys) {
        if ($AbsolutePath -match $prefix) {
            return @{
                Volume = $VolumeMap[$prefix]
                Path   = ($AbsolutePath -replace $prefix, '')
            }
        }
    }
    # Unmapped drive: still strip the letter so nothing absolute is published.
    return @{
        Volume = 'UNKNOWN-' + $AbsolutePath.Substring(0, 1).ToUpper()
        Path   = $AbsolutePath.Substring(3)
    }
}

function New-Record {
    param($Item, [int] $Id)

    $rec = [ordered]@{
        id       = $Id
        date     = $(if ($Item.Date) { $Item.Date.ToString('yyyy-MM-ddTHH:mm:ss') } else { $null })
        title    = $Item.Title
        author   = $Item.Author
        volume   = $Item.Volume
        path     = $Item.Path
        series   = $Item.Series
        fileType = $Item.FileType
        bytes    = $Item.Bytes
        duration = $Item.Duration
        source   = 'scan'
    }
    return [pscustomobject]$rec
}

function Get-DurationMap {
    <#
        Reads durations for one directory at a time through the shell property
        store, which is the only metadata reader guaranteed present on Windows.
        The "Length" column index moves between OS versions, so it is discovered
        from the column headers rather than hard coded.
    #>
    param([string] $Directory)

    $map = @{}
    try {
        $ns = $script:Shell.NameSpace($Directory)
        if (-not $ns) { return $map }

        if ($null -eq $script:DurationCol) {
            for ($i = 0; $i -lt 320; $i++) {
                if ($ns.GetDetailsOf($null, $i) -eq 'Length') { $script:DurationCol = $i; break }
            }
            if ($null -eq $script:DurationCol) { $script:DurationCol = 27 }
        }

        foreach ($item in $ns.Items()) {
            $raw = $ns.GetDetailsOf($item, $script:DurationCol)
            if ($raw -match '^(\d+):(\d{2}):(\d{2})$') {
                $map[$item.Name] = [int]$Matches[1] * 3600 + [int]$Matches[2] * 60 + [int]$Matches[3]
            }
        }
    } catch {
        Write-Verbose "Duration read failed for '$Directory': $($_.Exception.Message)"
    }
    return $map
}

# ---------------------------------------------------------------- scan

Write-Host 'Scanning volumes...' -ForegroundColor Cyan

$found = [Collections.Generic.List[object]]::new()
foreach ($r in $Root) {
    if (-not (Test-Path -LiteralPath $r)) {
        Write-Warning "Root not found, skipping: $r"
        continue
    }
    $rootFull = (Resolve-Path -LiteralPath $r).Path.TrimEnd('\')

    Get-ChildItem -LiteralPath $r -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $MediaExt -contains $_.Extension.ToLowerInvariant() } |
        ForEach-Object {
            if (Test-Excluded -FullName $_.FullName -Name $_.Name) { return }
            $found.Add([pscustomobject]@{
                FullName = $_.FullName
                Name     = $_.Name
                BaseName = $_.BaseName
                Ext      = $_.Extension.TrimStart('.').ToLowerInvariant()
                Dir      = $_.DirectoryName
                Rel      = $_.FullName.Substring($rootFull.Length).TrimStart('\')
                Bytes    = $_.Length
                Modified = $_.LastWriteTime
            })
        }
}
Write-Host "  media files found: $($found.Count)"

# ---------------------------------------------------------------- durations

if (-not $SkipDuration -and $found.Count) {
    Write-Host 'Reading durations...' -ForegroundColor Cyan
    $script:Shell = New-Object -ComObject Shell.Application
    $script:DurationCol = $null

    $dirs = $found | Group-Object Dir
    $i = 0
    $durations = @{}
    foreach ($g in $dirs) {
        $i++
        Write-Progress -Activity 'Reading durations' -Status "$i / $($dirs.Count)" `
            -PercentComplete ($i * 100 / $dirs.Count)
        $map = Get-DurationMap -Directory $g.Name
        foreach ($k in $map.Keys) { $durations["$($g.Name)\$k"] = $map[$k] }
    }
    Write-Progress -Activity 'Reading durations' -Completed
    Write-Host "  durations read: $($durations.Count)"
} else {
    $durations = @{}
}

# ---------------------------------------------------------------- parse

Write-Host 'Parsing metadata...' -ForegroundColor Cyan

$parsed = foreach ($f in $found) {
    # Prefer a date in the filename; fall back to the nearest dated ancestor
    # folder, which is how the "June 2012" style folders carry their date.
    $date = ConvertTo-Date $f.BaseName
    $segments = @($f.Rel -split '\\')
    if (-not $date -and $segments.Count -ge 2) {
        # Walk ancestors nearest-first: "SAT AUDIO\2007\June 2007\x.mp3" should
        # take its date from "June 2007" before falling back to "2007".
        for ($i = $segments.Count - 2; $i -ge 0; $i--) {
            $date = ConvertTo-Date $segments[$i]
            if ($date) { break }
        }
    }

    # "Anointing factor\master\x.mp3" belongs to the series "Anointing factor";
    # the encoder folder is not a series, so step over it.
    $series = ''
    for ($i = $segments.Count - 2; $i -ge 0; $i--) {
        if ($segments[$i] -notmatch $DerivativeDir) { $series = $segments[$i]; break }
    }

    $isDerivative = ($f.Rel -match $DerivativeDir) -or ($f.BaseName -match $DerivativeFile)

    [pscustomobject]@{
        Title    = Get-CleanTitle $f.BaseName
        Date     = $date
        Author   = Get-Author $f.BaseName
        Volume   = $Volume
        Path     = $f.Rel
        Series   = $series
        FileType = $f.Ext
        Bytes    = $f.Bytes
        Duration = $(if ($durations.ContainsKey($f.FullName)) { $durations[$f.FullName] } else { $null })
        Modified = $f.Modified
        IsDerivative = $isDerivative
    }
}
$parsed = @($parsed)

# ---------------------------------------------------------------- dedupe

Write-Host 'De-duplicating...' -ForegroundColor Cyan

# Pass 1 - drop re-encodes. A file in a master/compressed/converted folder is
# the same recording as its identically titled sibling outside one, and it
# usually lost the date from its name in the process, so it cannot be collapsed
# by the (title, date) key below.
$byTitle = $parsed | Group-Object { Get-NormalizedKey $_.Title }
$survivors = foreach ($g in $byTitle) {
    $originals = @($g.Group | Where-Object { -not $_.IsDerivative })
    if ($originals.Count) { $originals } else { $g.Group }
}
$survivors = @($survivors)

# Pass 2 - one record per recording. Same title on different dates stays
# separate; "Youth meeting" recurs for years and those are distinct services.
$deduped = $survivors |
    Group-Object { '{0}|{1}' -f (Get-NormalizedKey $_.Title), $(if ($_.Date) { $_.Date.ToString('yyyy-MM-dd') } else { '' }) } |
    ForEach-Object {
        # Largest file wins: it is the highest bitrate copy.
        $best = $_.Group | Sort-Object -Property Bytes -Descending | Select-Object -First 1
        $best | Add-Member -NotePropertyName Variants -NotePropertyValue $_.Count -PassThru
    }
$deduped = @($deduped)
Write-Host "  re-encodes dropped: $($parsed.Count - $survivors.Count)"
Write-Host "  unique recordings: $($deduped.Count) (from $($parsed.Count) files)"

# ---------------------------------------------------------------- merge

$records = [Collections.Generic.List[object]]::new()
$nextId = 0
$linked = 0
$added = 0

if ($ExistingJson -and (Test-Path -LiteralPath $ExistingJson)) {
    Write-Host 'Merging with existing catalog...' -ForegroundColor Cyan
    $existing = Get-Content -LiteralPath $ExistingJson -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($e in $existing) { $records.Add($e) }
    $nextId = ($records | ForEach-Object { [int]$_.id } | Measure-Object -Maximum).Maximum + 1

    # Strip drive letters from everything inherited from the old catalog before
    # anything else touches it. This is the privacy fix: the published JSON is
    # world-readable and currently spells out the operator's disk layout.
    $normalized = 0
    foreach ($rec in $records) {
        $abs = [string](Get-Prop $rec 'path')
        $split = ConvertTo-RelativePath $abs
        if ($split) {
            Add-Member -InputObject $rec -NotePropertyName volume -NotePropertyValue $split.Volume -Force
            Add-Member -InputObject $rec -NotePropertyName path   -NotePropertyValue $split.Path -Force
            $normalized++
        }

        # The original indexer copied the containing folder into 'group' and
        # sometimes the filename into 'title'. For files sitting at a drive
        # root that folder is "G:\", so these fields leak drive letters too.
        foreach ($field in @('group', 'title')) {
            $value = [string](Get-Prop $rec $field)
            if ($value -notmatch '^[A-Za-z]:\\') { continue }
            $tail = ($value.TrimEnd('\') -split '\\')[-1]
            if ($tail -match '^[A-Za-z]:$') { $tail = '' }
            Add-Member -InputObject $rec -NotePropertyName $field -NotePropertyValue $tail -Force
            $normalized++
        }
    }
    Write-Host "  absolute paths normalized: $normalized"

    # Index the scan so catalog records can claim a file.
    $byKey = @{}
    $byDate = @{}
    foreach ($d in $deduped) {
        $k = Get-NormalizedKey $d.Title
        if ($k) { if (-not $byKey.ContainsKey($k)) { $byKey[$k] = @() }; $byKey[$k] += $d }
        if ($d.Date) {
            $dk = $d.Date.ToString('yyyy-MM-dd')
            if (-not $byDate.ContainsKey($dk)) { $byDate[$dk] = @() }
            $byDate[$dk] += $d
        }
    }

    $claimed = [Collections.Generic.HashSet[string]]::new()

    foreach ($rec in $records) {
        if (Get-Prop $rec 'path') { continue }

        $recTitle = [string](Get-Prop $rec 'title')
        $recKey = if ($recTitle) { Get-NormalizedKey $recTitle } else { '' }
        $recDate = $null
        $rawDate = Get-Prop $rec 'date'
        if ($rawDate) { try { $recDate = ([datetime]$rawDate).ToString('yyyy-MM-dd') } catch { } }

        # Title match is authoritative; a same-day match is accepted only when
        # the day has exactly one candidate, otherwise it is a coin flip.
        $cand = $null
        if ($recKey -and $byKey.ContainsKey($recKey)) {
            $cand = $byKey[$recKey] | Where-Object { -not $claimed.Contains($_.Path) } | Select-Object -First 1
        }
        if (-not $cand -and $recDate -and $byDate.ContainsKey($recDate)) {
            $free = @($byDate[$recDate] | Where-Object { -not $claimed.Contains($_.Path) })
            if ($free.Count -eq 1) { $cand = $free[0] }
        }
        if (-not $cand) { continue }

        [void]$claimed.Add($cand.Path)
        $linked++

        # Attach the file. Curated title and author are left untouched.
        Add-Member -InputObject $rec -NotePropertyName volume   -NotePropertyValue $cand.Volume -Force
        Add-Member -InputObject $rec -NotePropertyName path     -NotePropertyValue $cand.Path -Force
        Add-Member -InputObject $rec -NotePropertyName fileType -NotePropertyValue $cand.FileType -Force
        Add-Member -InputObject $rec -NotePropertyName bytes    -NotePropertyValue $cand.Bytes -Force
        if ($cand.Duration) {
            Add-Member -InputObject $rec -NotePropertyName duration -NotePropertyValue $cand.Duration -Force
        }
        if (-not (Get-Prop $rec 'author') -and $cand.Author) {
            Add-Member -InputObject $rec -NotePropertyName author -NotePropertyValue $cand.Author -Force
        }
    }

    # Everything the catalog already knows about, by title and by filename, so a
    # second run does not append the same recording again.
    $known = [Collections.Generic.HashSet[string]]::new()
    foreach ($rec in $records) {
        $t = [string](Get-Prop $rec 'title')
        if ($t) { $k = Get-NormalizedKey $t; if ($k) { [void]$known.Add($k) } }
        $p = [string](Get-Prop $rec 'path')
        if ($p) {
            [void]$known.Add((Get-NormalizedKey (($p -split '\\')[-1] -replace '\.[a-z0-9]+$', '')))
        }
    }

    foreach ($d in $deduped) {
        if ($claimed.Contains($d.Path)) { continue }
        if ($known.Contains((Get-NormalizedKey $d.Title))) { continue }
        $records.Add((New-Record -Item $d -Id $nextId))
        $nextId++
        $added++
    }
} else {
    foreach ($d in $deduped) {
        $records.Add((New-Record -Item $d -Id $nextId))
        $nextId++
        $added++
    }
}

# ---------------------------------------------------------------- write

$json = $records | ConvertTo-Json -Depth 6
$outPath = if ([IO.Path]::IsPathRooted($OutputJson)) {
    $OutputJson
} else {
    Join-Path (Get-Location).Path $OutputJson
}
$outPath = [IO.Path]::GetFullPath($outPath)
[IO.File]::WriteAllText($outPath, $json, [Text.UTF8Encoding]::new($false))

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Write-Host "  records linked to a file : $linked"
Write-Host "  records added            : $added"
Write-Host "  catalog total            : $($records.Count)"
Write-Host "  written to               : $OutputJson"
