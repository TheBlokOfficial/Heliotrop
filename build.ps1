# Packs plugins/heliotrop into build/heliotrop-<version>.zip, plugin files at the zip root.
# Takes git-tracked and untracked-but-not-ignored files from the working tree.
# Entries use forward slashes and a fixed timestamp, so unchanged content gives an identical zip.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression

$root = $PSScriptRoot
$pluginDir = 'plugins/heliotrop'
$version = (Get-Content -Raw (Join-Path $root "$pluginDir/.claude-plugin/plugin.json") | ConvertFrom-Json).version
$outDir = Join-Path $root 'build'
$outFile = Join-Path $outDir "heliotrop-$version.zip"

$files = git -C $root ls-files --cached --others --exclude-standard -- $pluginDir | Sort-Object
if ($LASTEXITCODE -ne 0 -or -not $files) { throw "No files found under $pluginDir" }

New-Item -ItemType Directory -Force $outDir | Out-Null
Get-ChildItem $outDir -Filter 'heliotrop-*.zip' | Remove-Item

$stamp = [DateTimeOffset]::new(2026, 1, 1, 0, 0, 0, [TimeSpan]::Zero)
$stream = [IO.File]::Open($outFile, [IO.FileMode]::CreateNew)
$zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $entry = $zip.CreateEntry($file.Substring($pluginDir.Length + 1), [IO.Compression.CompressionLevel]::Optimal)
        $entry.LastWriteTime = $stamp
        $bytes = [IO.File]::ReadAllBytes((Join-Path $root $file))
        $out = $entry.Open()
        try { $out.Write($bytes, 0, $bytes.Length) } finally { $out.Dispose() }
    }
} finally {
    $zip.Dispose()
    $stream.Dispose()
}

Write-Host "Built $outFile ($($files.Count) files)"
