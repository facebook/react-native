#!/bin/bash
# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree. An additional grant
# of patent rights can be found in the PATENTS file in the same directory.

# Bundle React Native app's code and image assets.
# This script is supposed to be invoked as part of Xcode build process
# and relies on environment variables (including PWD) set by Xcode

case "$CONFIGURATION" in
  Debug)
    # Speed up build times by skipping the creation of the offline package for debug
    # builds on the simulator since the packager is supposed to be running anyways.
    if [[ "$PLATFORM_NAME" == *simulator ]]; then
      echo "Skipping bundling for Simulator platform"
      exit 0;
    fi

    DEV=true
    ;;
  "")
    echo "$0 must be invoked by Xcode"
    exit 1
    ;;
  *)
    DEV=false
    ;;
esac

# Path to react-native folder inside node_modules
REACT_NATIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Xcode project file for React Native apps is located in ios/ subfolder
cd ${REACT_NATIVE_DIR}/../..

# Define NVM_DIR and source the nvm.sh setup script
[ -z "$NVM_DIR" ] && export NVM_DIR="$HOME/.nvm"

# Define entry file
ENTRY_FILE=${1:-index.ios.js}

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  . "$HOME/.nvm/nvm.sh"
elif [[ -x "$(command -v brew)" && -s "$(brew --prefix nvm)/nvm.sh" ]]; then
  . "$(brew --prefix nvm)/nvm.sh"
fi

# Set up the nodenv node version manager if present
if [[ -x "$HOME/.nodenv/bin/nodenv" ]]; then
  eval "$("$HOME/.nodenv/bin/nodenv" init -)"
fi

[ -z "$NODE_BINARY" ] && export NODE_BINARY="node"

nodejs_not_found()
{
  echo "error: Can't find '$NODE_BINARY' binary to build React Native bundle" >&2
  echo "If you have non-standard nodejs installation, select your project in Xcode," >&2
  echo "find 'Build Phases' - 'Bundle React Native code and images'" >&2
  echo "and change NODE_BINARY to absolute path to your node executable" >&2
  echo "(you can find it by invoking 'which node' in the terminal)" >&2
  exit 2
}

type $NODE_BINARY >/dev/null 2>&1 || nodejs_not_found

# Print commands before executing them (useful for troubleshooting)
set -x
DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH

if [[ "$CONFIGURATION" = "Debug" && ! "$PLATFORM_NAME" == *simulator ]]; then
  PLISTBUDDY='/usr/libexec/PlistBuddy'
  PLIST=$TARGET_BUILD_DIR/$INFOPLIST_PATH
  IP=$(ipconfig getifaddr en0)
  if [ -z "$IP" ]; then
    IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | cut -d\   -f2  | awk 'NR==1{print $1}')
  fi
  $PLISTBUDDY -c "Add NSAppTransportSecurity:NSExceptionDomains:localhost:NSTemporaryExceptionAllowsInsecureHTTPLoads bool true" "$PLIST"
  $PLISTBUDDY -c "Add NSAppTransportSecurity:NSExceptionDomains:$IP.xip.io:NSTemporaryExceptionAllowsInsecureHTTPLoads bool true" "$PLIST"
  echo "$IP.xip.io" > "$DEST/ip.txt"
fi

BUNDLE_FILE="$DEST/main.jsbundle"

$NODE_BINARY "$REACT_NATIVE_DIR/local-cli/cli.js" bundle \
  --entry-file "$ENTRY_FILE" \
  --platform ios \
  --dev $DEV \
  --reset-cache \
  --bundle-output "$BUNDLE_FILE" \
  --assets-dest "$DEST"

if [[ ! $DEV && ! -f "$BUNDLE_FILE" ]]; then
  echo "error: File $BUNDLE_FILE does not exist. This must be a bug with" >&2
  echo "React Native, please report it here: https://github.com/facebook/react-native/issues"
  exit 2
fi
