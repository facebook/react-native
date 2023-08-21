#!/bin/bash
set -ex

# Script used by the Azure DevOps build agent to start the packager and web socket server

# Wait for the package to start
waitForPackager() {
  local -i max_attempts=60
  local -i attempt_num=1

  until curl -s http://localhost:8081/status | grep "packager-status:running" -q; do
    if (( attempt_num == max_attempts )); then
      echo "Packager did not respond in time. No more attempts left."
      exit 1
    else
      (( attempt_num++ ))
      echo "Packager did not respond. Retrying for attempt number $attempt_num..."
      sleep 1
    fi
  done

  echo "Packager is ready!"
}

waitForWebSocketServer() {
  local -i max_attempts=60
  local -i attempt_num=1

  until curl -s http://localhost:5555 | grep "Upgrade Required" -q; do
    if (( attempt_num == max_attempts )); then
      echo "WebSocket Server did not respond in time. No more attempts left."
      exit 1
    else
      (( attempt_num++ ))
      echo "WebSocket Server did not respond. Retrying for attempt number $attempt_num..."
      sleep 1
    fi
  done

  echo "WebSocket Server is ready!"
}

THIS_DIR=$PWD

# AppleScript can't be invoked from Azure DevOps Mojave agents until the following ticket is resolved: https://dev.azure.com/mseng/AzureDevOps/_workitems/edit/1513729

# Start the packager
# osascript -e "tell application \"Terminal\" to do script \"cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./scripts/launchPackager.command"

# Start the WebSocket test server
# osascript -e "tell application \"Terminal\" to do script \"cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./IntegrationTests/launchWebSocketServer.command\""

COMMAND="$TMPDIR/launchPackager.command"
echo "cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; PROJECT_ROOT=packages/rn-tester ./packages/react-native/scripts/launchPackager.command" > "$COMMAND"
chmod +x "$COMMAND"
open "$COMMAND"
waitForPackager

COMMAND="$TMPDIR/launchWebSocketServer.command"
echo "cd ${THIS_DIR}; export SERVERS_NO_WAIT=1; ./packages/rn-tester/IntegrationTests/launchWebSocketServer.command" > "$COMMAND"
chmod +x "$COMMAND"
open "$COMMAND"
waitForWebSocketServer
