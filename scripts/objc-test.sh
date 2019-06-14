#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script used to run iOS and tvOS tests.
# Environment variables are used to configure what test to run.
# If not arguments are passed to the script, it will only compile
# the RNTester.
# If the script is called with a single argument "test", we'll
# also run the RNTester integration test (needs JS and packager).
# ./objc-test.sh test

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

# Create cleanup handler
cleanup() {
  EXIT=$?
  set +e

  if [ $EXIT -ne 0 ]; then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f "$WATCHMAN_LOGS" ] && cat "$WATCHMAN_LOGS"
  fi

  # kill whatever is occupying port 8081 (packager)
  lsof -i tcp:8081 | awk 'NR!=1 {print $2}' | xargs kill
  # kill whatever is occupying port 5555 (web socket server)
  lsof -i tcp:5555 | awk 'NR!=1 {print $2}' | xargs kill
}

buildProject() {
  xcodebuild build \
    -workspace "RNTester/RNTesterPods.xcworkspace" \
    -scheme "RNTester" \
    -sdk "iphonesimulator"
}

buildAndRunTests() {
  xcodebuild build test \
    -workspace RNTester/RNTesterPods.xcworkspace \
    -scheme "RNTester" \
    -sdk "iphonesimulator" \
    -destination "$DESTINATION"
}

xcprettyFormat() {
  if [ "$CI" ]; then
    # Circle CI expects JUnit reports to be available here
    REPORTS_DIR="$HOME/react-native/reports"
  else
    THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

    # Write reports to the react-native root dir
    REPORTS_DIR="$THIS_DIR/../build/reports"
  fi

  xcpretty --report junit --output "$REPORTS_DIR/junit/ios/results.xml"
}

trap cleanup EXIT

cd "$ROOT" || exit

# If first argument is "test", actually start the packager and run tests.
# Otherwise, just build RNTesterPods and exit
if [ "$1" = "test" ]; then
  # shellcheck disable=SC1091
  source "scripts/.tests.env"
  DESTINATION="platform=iOS Simulator,name=${IOS_DEVICE},OS=${IOS_TARGET_OS}"

  # Start the packager
  PACKAGER_ARGS=()
  if [ "$CI" ]; then
    PACKAGER_ARGS+=("--max-workers=1")
  fi
  yarn start ${PACKAGER_ARGS[@]} &

  # Start the WebSocket test server
  open "./IntegrationTests/launchWebSocketServer.command"

  # Wait for packager to start
  max_attempts=60
  attempt_num=1

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

  # Preload the RNTesterApp bundle for better performance in integration tests
  curl -s 'http://localhost:8081/RNTester/js/RNTesterApp.ios.bundle?platform=ios&dev=true' -o /dev/null
  curl -s 'http://localhost:8081/RNTester/js/RNTesterApp.ios.bundle?platform=ios&dev=true&minify=false' -o /dev/null
  curl -s 'http://localhost:8081/IntegrationTests/IntegrationTestsApp.bundle?platform=ios&dev=true' -o /dev/null
  curl -s 'http://localhost:8081/IntegrationTests/RCTRootViewIntegrationTestApp.bundle?platform=ios&dev=true' -o /dev/null

  # Build and run tests.
  if [ -x "$(command -v xcpretty)" ]; then
    buildAndRunTests | xcprettyFormat && exit "${PIPESTATUS[0]}"

  else
    echo 'Warning: xcpretty is not installed. Install xcpretty to generate JUnit reports.'
    buildAndRunTests
  fi
else
  # Build without running tests.
  if [ -x "$(command -v xcpretty)" ]; then
    buildProject | xcprettyFormat && exit "${PIPESTATUS[0]}"
  else
    buildProject
  fi
fi
