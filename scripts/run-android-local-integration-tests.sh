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
adb shell am instrument -w com.facebook.react.tests/android.support.test.runner.AndroidJUnitRunner
