#!/bin/bash

# This script validates that iOS is set up correctly for the
# testing environment.
#
# In particular, it checks that the minimum required Xcode version is installed.
# It also checks that the correct Node version is installed. Node 10 is not fully 
# supported at the time and Node 6 is no longer supported.

# Function used to compare dot seperated version numbers
function version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }

# Check that node is installed.
if [ -z "$(which node)" ]; then
  echo "Could not find Node binary. Please check your nodejs install."
  echo "See http://facebook.github.io/react-native/docs/getting-started.html for instructions."
  exit 1
fi

# Check that the correct version of node is installed
NODE_VERSION="$(command node --version | sed 's/[-/a-zA-Z]//g' |sed 's/.\{2\}$//')"

if (( $(echo "${NODE_VERSION} <= 6.0" | bc -l) )); then
  echo "Node ${NODE_VERSION} detected. This version of Node is not supported."
  echo "Note: Node 10 is not fully supported at the time and Node 6 is no longer supported."  
  echo "See https://nodejs.org/en/download/ for instructions."
  exit 1
fi

if (( $(echo "${NODE_VERSION} == 10.0" | bc -l) )); then
  echo "Node ${NODE_VERSION} detected. This version of Node is not fully supported at this time."
  echo "See https://github.com/facebook/react-native/issues/19229 for more information."
  exit 1
fi

# Check that Xcode is installed.
if [ -z "$(which xcodebuild)" ]; then
  echo "Could not find Xcode build tools. Please check your Xcode install."
  echo "See http://facebook.github.io/react-native/docs/getting-started.html for instructions."
  exit 1
fi

MIN_XCODE_VERSION=9.4
# Check that the correct version of Xcode is installed
XCODE_VERSION="$(command xcodebuild -version | sed '$ d' | sed 's/[-/a-zA-Z]//g')"
if (version_gt $MIN_XCODE_VERSION $XCODE_VERSION) && [ "$XCODE_VERSION" != "$MIN_XCODE_VERSION" ]; then
  echo "Xcode ${XCODE_VERSION} detected. React Native requires ${MIN_XCODE_VERSION} or newer."
  echo "Older versions of Xcode may cause cryptic build errors."
  echo "See http://facebook.github.io/react-native/docs/getting-started.html for instructions."
  exit 1
fi
