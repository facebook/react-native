#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Script used to run iOS tests.
# If no arguments are passed to the script, it will only compile
# the RNTester.
# If the script is called with a single argument "test", we'll
# run the RNTester unit and integration tests
# ./objc-test.sh test

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

SKIPPED_TESTS=()
SKIPPED_TESTS+=("-skip-testing:RNTesterIntegrationTests/RNTesterSnapshotTests")
# TODO: T60408036 This test crashes iOS 13 for bad access, please investigate
# and re-enable. See https://gist.github.com/0xced/56035d2f57254cf518b5.
SKIPPED_TESTS+=("-skip-testing:RNTesterUnitTests/RCTJSONTests/testNotUTF8Convertible")

# Create cleanup handler
cleanup() {
  EXIT=$?
  set +e

  if [ $EXIT -ne 0 ];
  then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f "$WATCHMAN_LOGS" ] && cat "$WATCHMAN_LOGS"
  fi
  # kill whatever is occupying port 8081 (packager)
  lsof -i tcp:8081 | awk 'NR!=1 {print $2}' | xargs kill
  # kill whatever is occupying port 5555 (web socket server)
  lsof -i tcp:5555 | awk 'NR!=1 {print $2}' | xargs kill
}

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

runTests() {
  # shellcheck disable=SC1091
  source "./scripts/.tests.env"
  xcodebuild build test \
    -workspace packages/rn-tester/RNTesterPods.xcworkspace \
    -scheme RNTester \
    -sdk iphonesimulator \
    -destination "platform=iOS Simulator,name=$IOS_DEVICE,OS=$IOS_TARGET_OS" \
      "${SKIPPED_TESTS[@]}"
}

buildProject() {
  xcodebuild build \
    -workspace packages/rn-tester/RNTesterPods.xcworkspace \
    -scheme RNTester \
    -sdk iphonesimulator
}

xcbeautifyFormat() {
  if [ "$CI" ]; then
    # Circle CI expects JUnit reports to be available here
    REPORTS_DIR="$HOME/react-native/reports/junit"
  else
    THIS_DIR=$(cd -P "$(dirname "$(realpath "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

    # Write reports to the react-native root dir
    REPORTS_DIR="$THIS_DIR/../build/reports"
  fi

  xcbeautify --report junit --report-path "$REPORTS_DIR/ios/results.xml"
}

preloadBundles() {
  # Preload the RNTesterApp bundle for better performance in integration tests
  curl -s 'http://localhost:8081/packages/rn-tester/js/RNTesterApp.ios.bundle?platform=ios&dev=true' -o /dev/null
  curl -s 'http://localhost:8081/packages/rn-tester/js/RNTesterApp.ios.bundle?platform=ios&dev=true&minify=false' -o /dev/null
  curl -s 'http://localhost:8081/IntegrationTests/IntegrationTestsApp.bundle?platform=ios&dev=true' -o /dev/null
  curl -s 'http://localhost:8081/IntegrationTests/RCTRootViewIntegrationTestApp.bundle?platform=ios&dev=true' -o /dev/null
}

main() {
  cd "$ROOT" || exit

  # If first argument is "test", actually start the packager and run tests.
  # Otherwise, just build RNTester and exit
  if [ "$1" = "test" ]; then

    # Start the WebSocket test server
    echo "Launch WebSocket Server"
    sh "./IntegrationTests/launchWebSocketServer.sh" &
    waitForWebSocketServer

    # Start the packager
    yarn start --max-workers=1 || echo "Can't start packager automatically" &
    waitForPackager
    preloadBundles

    # Build and run tests.
    if [ -x "$(command -v xcbeautify)" ]; then
      runTests | xcbeautifyFormat && exit "${PIPESTATUS[0]}"
    else
      echo 'Warning: xcbeautify is not installed. Install xcbeautify to generate JUnit reports.'
      runTests
    fi
  else
    # Build without running tests.
    if [ -x "$(command -v xcbeautify)" ]; then
      buildProject | xcbeautifyFormat && exit "${PIPESTATUS[0]}"
    else
      buildProject
    fi
  fi
}

trap cleanup EXIT
main "$@"
