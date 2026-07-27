# Maintenance tools

## Build-Archive.ps1

Scans a media volume and merges what it finds into `archive.json`.

```powershell
cd tools
.\Build-Archive.ps1 -Root 'E:\' -Volume 'SAT-E' `
    -ExistingJson ..\archive.json -OutputJson ..\archive.json
```

Safe to re-run. It never overwrites a curated title or author, and it will not
append a recording the catalog already knows about.

### What it does on each run

1. **Appends new recordings.** Files under `-Root` that the catalog has never
   seen become new records.
2. **Links catalogued items to their audio.** Several hundred records were typed
   up from the old cassette ledgers and carry only a title, date and speaker.
   When a file turns out to match one, the file is attached to that existing
   record rather than added as a duplicate.
3. **Removes drive letters.** `archive.json` is served publicly. Absolute paths
   like `E:\TomaBlueHDD\SAT AUDIO\...` expose the maintainer's disk layout and
   are useless to a visitor, so every path is reduced to a `volume` name plus a
   volume-relative `path`. The deploy workflow fails the build if an absolute
   path ever reaches the published file.

### Matching rules

A catalogued item claims a file when the **titles match** after folding case,
diacritics and punctuation. Failing that, it claims a file recorded on the
**same date**, but only when that date has exactly one unclaimed candidate —
otherwise the choice would be a coin flip between two sermons.

### De-duplication

The same sermon commonly exists three or four times: an original, a `(master)`,
and re-encodes under `compressed files\` or `converted\`. Copies in those
working folders are dropped in favour of the original, then one record is kept
per `(title, date)` pair, preferring the largest file as the best-quality copy.

Titles repeat legitimately across years — "Youth meeting" recurs for a decade —
so recordings are only merged when the date matches too.

### Volumes

The archive spans four disks, and Windows has already reshuffled their drive
letters once. `$VolumeMap` in the script records which historical prefix belongs
to which logical volume:

| Volume      | Was                       | Status                          |
|-------------|---------------------------|---------------------------------|
| `SAT-E`     | `H:\`, `E:\TomaBlueHDD\`  | The disk currently mounted as E: |
| `SAT-F`     | `F:\`                     | Not currently attached           |
| `SAT-G`     | `G:\`                     | Not currently attached           |
| `SAT-E2024` | `E:\` (2024 material)     | Not currently attached           |

To index the remaining disks, attach one and re-run with `-Root` pointed at it
and `-Volume` set to the matching name.

### Options

| Option | Meaning |
|---|---|
| `-Root` | One or more directories to scan. Accepts several at once. |
| `-Volume` | Logical volume name stamped on newly found recordings. |
| `-ExistingJson` | Catalog to merge into. Omit to build from scratch. |
| `-OutputJson` | Where to write the result. |
| `-SkipDuration` | Skip reading audio durations — much faster, for a dry run. |
| `-IncludeVideo` | Also index mp4/mkv/mov/flv/wmv/m4v. |

Durations are read through the Windows shell property store, so no ffmpeg
install is required.

## json-to-exel.ps1

Exports the catalog to Excel for offline review. Unlike `archive.json`, the
Excel export may retain absolute paths — it is an internal artefact and should
not be committed or published.
