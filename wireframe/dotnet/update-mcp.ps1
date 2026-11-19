# Puts a new build of the tool where `wire mcp-host` runs it from, while sessions stay open:
# the host of each session sees the new mcp.stamp and starts its server again from a copy.
# Run from anywhere: pwsh dotnet/update-mcp.ps1 [-Build <folder>]
param(
    [string]$Build = (Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'wire/mcp')
)

$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot 'src/Wireframe.Cli/Wireframe.Cli.csproj'
$staging = Join-Path ([IO.Path]::GetTempPath()) ("wire-mcp-" + [Guid]::NewGuid().ToString('N'))

dotnet publish $project -c Release -o $staging --nologo -v:q
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed ($LASTEXITCODE)" }

New-Item -ItemType Directory -Force $Build | Out-Null
Copy-Item (Join-Path $staging '*') $Build -Recurse -Force
# Last: a host starts the new server only once every file is there
Set-Content (Join-Path $Build 'mcp.stamp') ([DateTime]::UtcNow.Ticks) -NoNewline
Remove-Item $staging -Recurse -Force
Write-Host "wire mcp: a new build in $Build"
