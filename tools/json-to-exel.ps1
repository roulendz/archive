# Import required modules
# If ImportExcel module is not installed, you will need to install it first:
# Install-Module -Name ImportExcel -Scope CurrentUser -Force

param(
    [string]$JsonFilePath = "archive_20250322_184450.json",
    [string]$OutputExcelPath = "archive_export.xlsx",
    [string]$Encoding = "UTF8"
)

# Check if ImportExcel module is installed
if (-not (Get-Module -ListAvailable -Name ImportExcel)) {
    Write-Host "The ImportExcel module is required but not installed." -ForegroundColor Red
    Write-Host "To install it, run: Install-Module -Name ImportExcel -Scope CurrentUser -Force" -ForegroundColor Yellow
    exit
}

# Import the module
Import-Module ImportExcel

# Check if the JSON file exists
if (-not (Test-Path $JsonFilePath)) {
    Write-Host "The specified JSON file does not exist: $JsonFilePath" -ForegroundColor Red
    exit
}

try {
    # Read the JSON file with proper encoding
    Write-Host "Reading JSON file: $JsonFilePath with $Encoding encoding"
    $jsonContent = Get-Content -Path $JsonFilePath -Raw -Encoding $Encoding
    
    # Fix potential BOM (Byte Order Mark) issues
    if ($jsonContent.StartsWith([char]0xFEFF)) {
        $jsonContent = $jsonContent.Substring(1)
    }
    
    # Fix malformed JSON: Check if it's an array or needs to be wrapped in array brackets
    $jsonContent = $jsonContent.Trim()
    if ($jsonContent.StartsWith("{") -and $jsonContent.EndsWith("}")) {
        # Single object - wrap in array
        $jsonContent = "[$jsonContent]"
    }
    elseif ($jsonContent.StartsWith("{") -and $jsonContent.EndsWith("]")) {
        # Malformed JSON with missing opening bracket
        $jsonContent = "[$jsonContent"
    }
    
    # Handle trailing commas that can break JSON parsing
    $jsonContent = $jsonContent -replace ',\s*]', ']' -replace ',\s*}', '}'
    
    Write-Host "Parsing JSON data..."
    try {
        $originalData = $jsonContent | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        Write-Host "Error parsing JSON. Attempting fallback method..." -ForegroundColor Yellow
        # Fallback: try to parse JSON line by line
        $jsonLines = $jsonContent -split "`n" | Where-Object { $_.Trim() -ne "" }
        $originalData = @()
        foreach ($line in $jsonLines) {
            try {
                $item = $line | ConvertFrom-Json -ErrorAction Stop
                $originalData += $item
            }
            catch {
                Write-Host "Could not parse line: $line" -ForegroundColor Red
            }
        }
    }
    
    # If originalData is not an array, convert it to one
    if ($originalData -isnot [System.Array]) {
        $originalData = @($originalData)
    }
    
    Write-Host "Processing $($originalData.Count) records..."
    
    # Define the expected property order (ensure path is included)
    $expectedProperties = @(
        "id",
        "date",
        "title",
        "author",
        "path",
        "duration",
        "fileType",
        "group",
        "quality",
        "duration_formatted"
    )
    
    # Convert the JSON data to a PowerShell custom object array with consistent properties
    $data = @()
    foreach ($item in $originalData) {
        # Skip null items
        if ($null -eq $item) { continue }
        
        # Create a hashtable with all the expected properties initialized to empty strings
        $properties = @{}
        foreach ($propName in $expectedProperties) {
            # Skip duration_formatted as we'll add it later
            if ($propName -ne "duration_formatted") {
                $properties[$propName] = ""
            }
        }
        
        # Fill in the properties from the original item
        foreach ($prop in $item.PSObject.Properties) {
            if ($properties.ContainsKey($prop.Name)) {
                $properties[$prop.Name] = $prop.Value
            }
        }
        
        # Create the custom object with ordered properties
        $psItem = [PSCustomObject]$properties
        
        # Format the date property carefully - crucial fix for date issues
        if ($psItem.date -and -not [string]::IsNullOrWhiteSpace($psItem.date)) {
            try {
                # Explicitly parse the date string to ensure correct formatting
                # This pattern handles ISO 8601 dates (e.g. "2021-12-19T18:50:22.000")
                if ($psItem.date -match '(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})') {
                    $year = [int]$Matches[1]
                    $month = [int]$Matches[2]
                    $day = [int]$Matches[3]
                    $hour = [int]$Matches[4]
                    $minute = [int]$Matches[5]
                    $second = [int]$Matches[6]
                    
                    # Create a DateTime object
                    $dateTime = New-Object DateTime $year, $month, $day, $hour, $minute, $second
                    
                    # Store as string in a format Excel recognizes well
                    $psItem.date = $dateTime.ToString("yyyy-MM-dd HH:mm:ss")
                }
                else {
                    # Fallback to standard parsing if the regex match fails
                    $dateTime = [DateTime]::Parse($psItem.date)
                    $psItem.date = $dateTime.ToString("yyyy-MM-dd HH:mm:ss")
                }
                
                Write-Host "Successfully parsed date: $($psItem.date) for ID: $($psItem.id)"
            }
            catch {
                Write-Host "Warning: Could not parse date for item ID $($psItem.id): $($psItem.date)" -ForegroundColor Yellow
            }
        }
        
        # Add formatted duration property if duration exists and is a number greater than 0
        if ($psItem.duration -and 
            $psItem.duration -match '^\d+$' -and 
            [int]$psItem.duration -gt 0) {
            
            $timeSpan = [TimeSpan]::FromSeconds([int]$psItem.duration)
            $psItem | Add-Member -MemberType NoteProperty -Name "duration_formatted" -Value ("{0:hh\:mm\:ss}" -f $timeSpan) -Force
        }
        else {
            # Add empty duration_formatted property
            $psItem | Add-Member -MemberType NoteProperty -Name "duration_formatted" -Value "" -Force
        }
        
        $data += $psItem
    }
    
    # If no data was parsed, exit
    if ($data.Count -eq 0) {
        Write-Host "No valid data was found in the JSON file." -ForegroundColor Red
        exit
    }
    
    Write-Host "Creating Excel file..."
    
    # Create a temporary CSV with UTF8 encoding to preserve special characters
    $tempCsvPath = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.csv'
    
    # Define the explicit column order for the export
    $columnOrder = @(
        "id",
        "date",
        "title",
        "author",
        "path",
        "duration",
        "duration_formatted",
        "fileType",
        "group",
        "quality"
    )
    
    # Export to CSV first to preserve encoding and date formats
    $data | Select-Object $columnOrder | Export-Csv -Path $tempCsvPath -NoTypeInformation -Encoding UTF8
    
    # Check if the temporary CSV was created
    if (-not (Test-Path $tempCsvPath)) {
        Write-Host "Failed to create temporary CSV file." -ForegroundColor Red
        exit
    }
    
    # Create Excel file from the CSV
    $excelParams = @{
        Path          = $OutputExcelPath
        WorksheetName = "Archive"
        AutoSize      = $true
        FreezeTopRow  = $true
        BoldTopRow    = $true
        AutoFilter    = $true
        ClearSheet    = $true
    }
    
    Import-Csv -Path $tempCsvPath -Encoding UTF8 | Export-Excel @excelParams
    
    # Open the Excel package to apply additional formatting
    $excel = Open-ExcelPackage -Path $OutputExcelPath
    $worksheet = $excel.Workbook.Worksheets["Archive"]
    
    # Find the date column index
    $dateColumnIndex = 0
    for ($i = 1; $i -le $worksheet.Dimension.Columns; $i++) {
        if ($worksheet.Cells[1, $i].Value -eq "date") {
            $dateColumnIndex = $i
            break
        }
    }
    
    # Apply date format to the date column
    if ($dateColumnIndex -gt 0) {
        # Get the range for the date column (excluding header)
        $dateRange = $worksheet.Cells[2, $dateColumnIndex, $worksheet.Dimension.Rows, $dateColumnIndex]
        
        # Apply a custom date format that Excel recognizes
        $dateRange.Style.Numberformat.Format = "yyyy-mm-dd hh:mm:ss"
    }
    
    # Save and close the Excel package
    Close-ExcelPackage $excel -Show
    
    # Clean up the temporary CSV file
    if (Test-Path $tempCsvPath) {
        Remove-Item -Path $tempCsvPath -Force
    }
    
    Write-Host "Excel file created successfully: $OutputExcelPath" -ForegroundColor Green
    Write-Host "Total records processed: $($data.Count)"
}
catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
    Write-Host "Stack Trace: $($_.ScriptStackTrace)" -ForegroundColor Red
}