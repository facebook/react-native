#!/bin/bash

# This script contains common code to be run from scripts/objc-test-ios.sh or scripts/objc-test-tvos.sh

# Start the packager and preload the UIExplorerApp bundle for better performance in integration tests
open "./packager/launchPackager.command" || echo "Can't start packager automatically"
open "./IntegrationTests/launchWebSocketServer.command" || echo "Can't start web socket server automatically"
sleep 20
curl 'http://localhost:8081/Examples/UIExplorer/js/UIExplorerApp.ios.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/Examples/UIExplorer/js/UIExplorerApp.ios.bundle?platform=ios&dev=true&minify=false' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/IntegrationTests/IntegrationTestsApp.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/IntegrationTests/RCTRootViewIntegrationTestApp.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle

function cleanup {
  EXIT_CODE=$?
  set +e

  if [ $EXIT_CODE -ne 0 ];
  then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f $WATCHMAN_LOGS ] && cat $WATCHMAN_LOGS
  fi
  # kill whatever is occupying port 8081 (packager)
  lsof -i tcp:8081 | awk 'NR!=1 {print $2}' | xargs kill
  # kill whatever is occupying port 5555 (web socket server)
  lsof -i tcp:5555 | awk 'NR!=1 {print $2}' | xargs kill
}
trap cleanup EXIT

if [ -z "$XCODE_BUILD_STEPS" ]; then
  XCODE_BUILD_STEPS="build test"
fi
# TODO: We use xcodebuild because xctool would stall when collecting info about
# the tests before running them. Switch back when this issue with xctool has
# been resolved.
if [ -n "$XCODE_DESTINATION" ]; then
  xcodebuild \
    -project $XCODE_PROJECT \
    -scheme $XCODE_SCHEME \
    -sdk $XCODE_SDK \
    -destination "$XCODE_DESTINATION" \
    $XCODE_BUILD_STEPS
else
  xcodebuild \
    -project $XCODE_PROJECT \
    -scheme $XCODE_SCHEME \
    -sdk $XCODE_SDK \
    $XCODE_BUILD_STEPS
fi
