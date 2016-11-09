#!/bin/bash

# Runs all Android unit tests locally.
# See http://facebook.github.io/react-native/docs/testing.html

set -e

which buck > /dev/null || { 
  echo "React Native uses the Buck build tool to run tests. Please install Buck: https://buckbuild.com/setup/install.html";
  exit 1;
}

echo "Fetching dependencies..."
buck fetch ReactAndroid/src/test/...
echo "Running unit tests..."
buck test ReactAndroid/src/test/...
