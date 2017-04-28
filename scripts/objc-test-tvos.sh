#!/bin/bash
set -ex

# Script used to run tvOS tests.
# If not arguments are passed to the script, it will only compile
# the UIExplorer.
# If the script is called with a single argument "test", we'll
# also run the UIExplorer integration test (needs JS and packager):
# ./objc-test-tvos.sh test

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

cd "$ROOT"

SCHEME="UIExplorer-tvOS"
SDK="appletvsimulator"
DESTINATION="platform=tvOS Simulator,name=Apple TV 1080p,OS=10.1"

# If there's a "test" argument, pass it to the test script.
. ./scripts/objc-test.sh $1

