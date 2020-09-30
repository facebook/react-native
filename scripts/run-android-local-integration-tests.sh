#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Runs all Android integration tests locally.
# See https://reactnative.dev/docs/testing.html

source $(dirname $0)/validate-android-sdk.sh
source $(dirname $0)/validate-android-test-env.sh
source $(dirname $0)/validate-android-device-env.sh

set -e

echo "Compiling native code..."
./gradlew :ReactAndroid:packageReactNdkLibsForBuck

echo "Building JS bundle..."
node cli.js bundle --platform android --dev true --entry-file ReactAndroid/src/androidTest/js/TestBundle.js --bundle-output ReactAndroid/src/androidTest/assets/AndroidTestBundle.js

echo "Installing test app on the device..."
buck fetch ReactAndroid/src/androidTest/buck-runner:instrumentation-tests
buck install ReactAndroid/src/androidTest/buck-runner:instrumentation-tests

echo "Running integration tests..."
# Use the JS script that runs all tests in a loop and is easy to tweak
node ./scripts/run-android-ci-instrumentation-tests.js --path ./ReactAndroid/src/androidTest/java/com/facebook/react/tests --package com.facebook.react.tests
