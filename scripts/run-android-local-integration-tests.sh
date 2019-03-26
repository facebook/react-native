#!/bin/bash

# Runs all Android integration tests locally.
# See http://facebook.github.io/react-native/docs/testing.html

source $(dirname $0)/validate-android-sdk.sh
source $(dirname $0)/validate-android-test-env.sh
source $(dirname $0)/validate-android-device-env.sh

set -e

echo "Compiling native code..."
./gradlew :ReactAndroid:packageReactNdkLibsForBuck

echo "Building JS bundle..."
node local-cli/cli.js bundle --platform android --dev true --entry-file ReactAndroid/src/androidTest/js/TestBundle.js --bundle-output ReactAndroid/src/androidTest/assets/AndroidTestBundle.js

echo "Installing test app on the device..."
buck fetch ReactAndroid/src/androidTest/buck-runner:instrumentation-tests
buck install ReactAndroid/src/androidTest/buck-runner:instrumentation-tests

echo "Running integration tests..."
# Use the JS script that runs all tests in a loop and is easy to tweak
node ./scripts/run-android-ci-instrumentation-tests.js --path ./ReactAndroid/src/androidTest/java/com/facebook/react/tests --package com.facebook.react.tests
