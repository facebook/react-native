#!/bin/bash

# Runs all Android unit tests locally.
# See http://facebook.github.io/react-native/docs/testing.html

source $(dirname $0)/validate-android-sdk.sh
source $(dirname $0)/validate-android-test-env.sh

set -e

echo "Fetching dependencies..."
buck fetch ReactAndroid/src/test/...

echo "Running unit tests..."
buck test ReactAndroid/src/test/...
