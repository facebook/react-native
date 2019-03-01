param(
	[int] $WindowWidth = 0,
	[int] $WindowHeight = 0
)

if (0 -lt $WindowWidth -and 0 -lt $WindowHeight) {
	[Console]::WindowWidth = $WindowWidth
	[Console]::WindowHeight = $WindowHeight
	[Console]::BufferWidth = $WindowWidth
}

Write-Host 'React Packager'
Clear-Host

$root = Split-Path $PSScriptRoot
node.exe $root\local-cli\cli.js start $args