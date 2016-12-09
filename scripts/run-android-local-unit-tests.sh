#!/bin/bash

# Runs all Android unit tests locally.
# See http://facebook.github.io/react-native/docs/testing.html

source $(dirname $0)/validate-android-sdk.sh
source $(dirname $0)/validate-android-test-env.sh

set -e

echo "Fetching dependencies..."
buck fetch ReactAndroid/src/test/...

# TODO: figure out if we need these
# buck fetch ReactAndroid/src/androidTest/...
# buck fetch ReactAndroid/src/main/java/com/facebook/react
# buck fetch ReactAndroid/src/main/java/com/facebook/react/shell
# buck fetch ReactAndroid/src/main/third-party/java/robolectric3/...
# buck fetch ReactAndroid/src/test/java/com/facebook/react/modules

echo "Running unit tests..."
buck test ReactAndroid/src/test/...
