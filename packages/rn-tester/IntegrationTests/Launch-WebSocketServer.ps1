param(
	[int] $WindowWidth = 0,
	[int] $WindowHeight = 0,
  [string] $File = 'websocket_integration_test_server.js'
)

if (0 -lt $WindowWidth -and 0 -lt $WindowHeight) {
	[Console]::WindowWidth = $WindowWidth
	[Console]::WindowHeight = $WindowHeight
	[Console]::BufferWidth = $WindowWidth
}

Write-Host "Web Socket Test Server"
Clear-Host

Push-Location $PSScriptRoot
node.exe $File
Pop-Location
