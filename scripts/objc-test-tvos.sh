#!/bin/bash
# Copyright (c) 2015-present, Facebook, Inc.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# Script used to run tvOS tests.
# If not arguments are passed to the script, it will only compile
# the RNTester.
# If the script is called with a single argument "test", we'll
# also run the RNTester integration test (needs JS and packager):
# ./objc-test-tvos.sh test

set -ex

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

cd "$ROOT"

export TEST_NAME="tvOS"
export SCHEME="RNTester-tvOS"
export SDK="appletvsimulator"
export DESTINATION="platform=tvOS Simulator,name=Apple TV,OS=11.4"

# If there's a "test" argument, pass it to the test script.
. ./scripts/objc-test.sh $1

