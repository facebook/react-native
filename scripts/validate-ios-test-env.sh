#!/bin/bash

# This script validates that iOS is set up correctly for the
# testing environment.
#
# In particular, it checks that the minimum required Xcode version is installed.
# It also checks that the correct Node version is installed. Node 10 is not fully 
# supported at the time and Node 6 is no longer supported.

# Check that node is installed.
if [ -z "$(which node)" ]; then
  echo "You need to install nodejs."
  echo "Note: Node 10 is not fully supported at the time and Node 6 is no longer supported."
  echo "See https://nodejs.org/en/download/ for instructions."
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
  echo "Node ${NODE_VERSION} detected. This version of Node is not supported."
  echo "Note: Node 10 is not fully supported at the time and Node 6 is no longer supported."  
  echo "See https://nodejs.org/en/download/ for instructions."
  exit 1
fi

# Check that Xcode is installed.
if [ -z "$(which xcodebuild)" ]; then
  echo "You need to install nodejs."
  echo "Note: Node 10 is not fully supported at the time, Node 6 is no longer supported"  
  echo "See https://nodejs.org/en/download/ for instructions."
  exit 1
fi

# Check that the correct version of Xcode is installed
XCODE_VERSION="$(command xcodebuild -version | sed '$ d' | sed 's/[-/a-zA-Z]//g')"
if (( $(echo "${XCODE_VERSION} <= 8.0" | bc -l) )); then
  echo "Xcode ${XCODE_VERSION} detected. Please upgrade to a later version using the AppStore."
  echo "Older versions of Xcode may cause cryptic build errors."
  exit 1
fi