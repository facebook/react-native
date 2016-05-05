#!/bin/bash

# Runs all Android integration tests locally.
# See http://facebook.github.io/react-native/docs/testing.html

which buck > /dev/null || { 
  echo "React Native uses the Buck build tool to run tests. Please install Buck: https://buckbuild.com/setup/install.html";
  exit 1;
}

echo "Compiling native code..."
./gradlew :ReactAndroid:packageReactNdkLibsForBuck
echo "Building JS bundle..."
node local-cli/cli.js bundle --platform android --dev true --entry-file ReactAndroid/src/androidTest/js/TestBundle.js --bundle-output ReactAndroid/src/androidTest/assets/AndroidTestBundle.js
echo "Installing test app on the device..."
buck install ReactAndroid/src/androidTest/buck-runner:instrumentation-tests
echo "Running integration tests..."
./scripts/run-android-instrumentation-tests.sh com.facebook.react.tests
