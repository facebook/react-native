#!/bin/bash
set -ex

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

# If first argument is "test", actually start the packager and run tests.
# Otherwise, just build RNTester for tvOS and exit

if [ "$1" = "test" ]; then

# Start the packager
./scripts/launchPackager.command &> 'launchPackager.command.log' &
# Start the WebSocket test server
./IntegrationTests/launchWebSocketServer.command &> 'launchWebSocketServer.command.log' &

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

# Run tests
# TODO: We use xcodebuild because xctool would stall when collecting info about
# the tests before running them. Switch back when this issue with xctool has
# been resolved.
xcodebuild \
  -project "RNTester/RNTester.xcodeproj" \
  -scheme $SCHEME \
  -sdk $SDK \
  -destination "$DESTINATION" \
  build test

else

# Don't run tests. No need to pass -destination to xcodebuild.
# TODO: We use xcodebuild because xctool would stall when collecting info about
# the tests before running them. Switch back when this issue with xctool has
# been resolved.
xcodebuild \
  -project "RNTester/RNTester.xcodeproj" \
  -scheme $SCHEME \
  -sdk $SDK \
  build

fi

echo 'launchPackager.command.log'
echo '=============================='
cat launchPackager.command.log
echo '=============================='
echo ''
echo 'launchWebSocketServer.command'
echo '=============================='
cat launchWebSocketServer.command.log
echo '=============================='
