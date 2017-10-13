#!/bin/bash
set -ex

# Script used to run iOS tests.
# If not arguments are passed to the script, it will only compile
# the RNTester.
# If the script is called with a single argument "test", we'll
# also run the RNTester integration test (needs JS and packager):
# ./objc-test-ios.sh test

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

cd "$ROOT"

SCHEME="RNTester"
SDK="iphonesimulator"
DESTINATION="platform=iOS Simulator,name=iPhone 5s,OS=10.3.1"

# If there's a "test" argument, pass it to the test script.
. ./scripts/objc-test.sh $1
