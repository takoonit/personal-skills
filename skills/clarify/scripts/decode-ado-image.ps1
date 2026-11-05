<#
.SYNOPSIS
  Decode an Azure DevOps work-item image attachment into a PNG an agent can view.

.DESCRIPTION
  The ADO MCP attachment tool returns the image as base64 text. Large results are
  saved by the harness as a JSON file whose base64 is JSON-escaped (\/ and \n) and
  may be cut off, so a plain FromBase64String fails. This script extracts and
  cleans the base64, decodes it, and writes a copy whose longer side is at most
  MaxSide, because the Read tool rejects images over 2576px on either side.

.EXAMPLE
  ./decode-ado-image.ps1 -InputPath <tool-results\toolu_x.json> -OutDir <scratchpad>
#>
param(
  [Parameter(Mandatory)] [string] $InputPath,
  [Parameter(Mandatory)] [string] $OutDir,
  [string] $Name = 'ado-attachment',
  [int] $MaxSide = 2400
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$text = Get-Content -LiteralPath $InputPath -Raw
$match = [regex]::Match($text, 'base64,([^\]"]+)')
$b64 = if ($match.Success) { $match.Groups[1].Value } else { $text }
$b64 = ($b64 -replace '\\/', '/' -replace '\\n|\s', '').TrimEnd('\')
$b64 = $b64.Substring(0, $b64.Length - ($b64.Length % 4))

$raw = Join-Path $OutDir "$Name-raw.png"
[IO.File]::WriteAllBytes($raw, [Convert]::FromBase64String($b64))

$img = [Drawing.Image]::FromFile($raw)
try {
  $scale = [Math]::Min(1.0, $MaxSide / [double][Math]::Max($img.Width, $img.Height))
  $width = [Math]::Max(1, [int]($img.Width * $scale))
  $height = [Math]::Max(1, [int]($img.Height * $scale))
  $bmp = New-Object Drawing.Bitmap $width, $height
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.DrawImage($img, 0, 0, $width, $height)
  $out = Join-Path $OutDir "$Name.png"
  $bmp.Save($out, [Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  "$($img.Width)x$($img.Height) -> ${width}x$height : $out"
} finally {
  $img.Dispose()
}
