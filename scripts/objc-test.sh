#!/bin/bash
set -ex -o pipefail

# Script used to run iOS and tvOS tests.
# Environment variables are used to configure what test to run.
# If not arguments are passed to the script, it will only compile
# the RNTester.
# If the script is called with a single argument "test", we'll
# also run the RNTester integration test (needs JS and packager).
# ./objc-test.sh test

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)

cd $ROOT

# Create cleanup handler
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

export RCT_NO_LAUNCH_PACKAGER=1

# If first argument is "test", start the packager and warm it up
if [ "$1" = "test" ]; then

# Start the packager
open "./scripts/launchPackager.command" || echo "Can't start packager automatically"
# Start the WebSocket test server
open "./IntegrationTests/launchWebSocketServer.command" || echo "Can't start web socket server automatically"

# Preload the RNTesterApp bundle for better performance in integration tests
sleep 20
curl 'http://localhost:8081/RNTester/js/RNTesterApp.ios.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/RNTester/js/RNTesterApp.ios.bundle?platform=ios&dev=true&minify=false' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/IntegrationTests/IntegrationTestsApp.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/IntegrationTests/RCTRootViewIntegrationTestApp.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle

# Build for testing
xcodebuild \
  -project "RNTester/RNTester.xcodeproj" \
  -scheme $SCHEME \
  -sdk $SDK \
  build-for-testing | \
tee xcodebuild.log | xcpretty

xctool \
  -project "RNTester/RNTester.xcodeproj" \
  -scheme $SCHEME \
  -sdk $SDK \
  -destination "$DESTINATION" \
  run-tests

else

# Build
xcodebuild \
  -project "RNTester/RNTester.xcodeproj" \
  -scheme $SCHEME \
  -sdk $SDK \
  build-for-testing | \
tee xcodebuild.log | xcpretty

fi
