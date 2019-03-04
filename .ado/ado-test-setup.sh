#!/bin/bash
set -ex

# Script used by the Azure DevOps build agent to start the packager and web socket server

THIS_DIR=$PWD

# Start the packager
osascript -e "tell application \"Terminal\" to do script \"cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./scripts/launchPackager.command\""

# Start the WebSocket test server
osascript -e "tell application \"Terminal\" to do script \"cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./IntegrationTests/launchWebSocketServer.command\""
