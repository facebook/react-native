#!/bin/bash
set -ex

# Script used by the Azure DevOps build agent to start the packager and web socket server

THIS_DIR=$PWD

# AppleScript can't be invoked from Azure DevOps Mojave agents until the following ticket is resolved: https://dev.azure.com/mseng/AzureDevOps/_workitems/edit/1513729

# Start the packager
# osascript -e "tell application \"Terminal\" to do script \"cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./scripts/launchPackager.command"

# Start the WebSocket test server
# osascript -e "tell application \"Terminal\" to do script \"cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./IntegrationTests/launchWebSocketServer.command\""

COMMAND="$TMPDIR/launchPackager.command"
echo "cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./scripts/launchPackager.command > "$COMMAND"
chmod +x "$COMMAND"
open "$COMMAND"

COMMAND="$TMPDIR/launchWebSocketServer.command"
echo "cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./IntegrationTests/launchWebSocketServer.command" > "$COMMAND"
chmod +x "$COMMAND"
open "$COMMAND"
