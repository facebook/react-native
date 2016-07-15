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

PLISTBUDDY='/usr/libexec/PlistBuddy'
PLIST=$TARGET_BUILD_DIR/$INFOPLIST_PATH

# 3 options for adding 'localhost' exception for ATS when using the iphonesimulator platform: add it, give a warning, or give an error and fail to build.
ATS_LOCALHOST_EXCEPTION_MISSING="warn" # valid options: "add", "warn", "error"

case "$CONFIGURATION" in
  Debug)
    # Speed up build times by skipping the creation of the offline package for debug
    # builds on the simulator since the packager is supposed to be running anyways.
    if [[ "$PLATFORM_NAME" = "iphonesimulator" ]]; then
      localhost_exception=$($PLISTBUDDY -c "Print NSAppTransportSecurity:NSExceptionDomains:localhost:NSTemporaryExceptionAllowsInsecureHTTPLoads" "$PLIST")
      if [[ "$localhost_exception" = "true" ]]; then
        echo "Confirmed 'localhost' exception for App Transport Security in $PLIST"
      else
        SOURCE_PLIST="$SOURCE_ROOT/$PROJECT_NAME/Info.plist"
        ATS_EXCEPTION_MSG="The development server will not be accessible without adding a 'localhost' exception for App Transport Security to the Info.plist file. To do this, perform the command '$PLISTBUDDY -c \"Add NSAppTransportSecurity:NSExceptionDomains:localhost:NSTemporaryExceptionAllowsInsecureHTTPLoads bool true\" \"$SOURCE_PLIST\"'"

        if [[ "$ATS_LOCALHOST_EXCEPTION_MISSING" = "add" ]]; then
          echo "Adding 'localhost' exception for App Transport Security to $PLIST"
          $PLISTBUDDY -c "Add NSAppTransportSecurity:NSExceptionDomains:localhost:NSTemporaryExceptionAllowsInsecureHTTPLoads bool true" "$PLIST"
        elif [[ "$ATS_LOCALHOST_EXCEPTION_MISSING" = "warn" ]]; then
          echo "warning: $ATS_EXCEPTION_MSG">&2
        elif [[ "$ATS_LOCALHOST_EXCEPTION_MISSING" = "error" ]]; then
          echo "error: $ATS_EXCEPTION_MSG">&2
          exit 1
        fi
      fi

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
cd ..

# Define NVM_DIR and source the nvm.sh setup script
[ -z "$NVM_DIR" ] && export NVM_DIR="$HOME/.nvm"

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  . "$HOME/.nvm/nvm.sh"
elif [[ -x "$(command -v brew)" && -s "$(brew --prefix nvm)/nvm.sh" ]]; then
  . "$(brew --prefix nvm)/nvm.sh"
fi

# Set up the nodenv node version manager if present
if [[ -x "$HOME/.nodenv/bin/nodenv" ]]; then
  eval "$($HOME/.nodenv/bin/nodenv init -)"
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

if [[ "$CONFIGURATION" = "Debug" && "$PLATFORM_NAME" != "iphonesimulator" ]]; then
    # This would seem unnecessary for cases other than the simulator.
    # localhost_exception=$($PLISTBUDDY -c "Print NSAppTransportSecurity:NSExceptionDomains:localhost:NSTemporaryExceptionAllowsInsecureHTTPLoads" "$PLIST")
    # if [[ "$localhost_exception" = "true" ]]; then
    #   echo "Confirmed 'localhost' exception for App Transport Security in $PLIST"
    # else
    #   echo "Adding 'localhost' exception for App Transport Security to $PLIST"
    #   $PLISTBUDDY -c "Add NSAppTransportSecurity:NSExceptionDomains:localhost:NSTemporaryExceptionAllowsInsecureHTTPLoads bool true" "$PLIST"
    # fi

  IP=$(ipconfig getifaddr en1)                              # wi-fi prioritized, since the device will use wi-fi
  if [[ -z "$IP" ]]; then IP=$(ipconfig getifaddr en0) ; fi # if wi-fi doesn't have an IP address, try ethernet

  if [[ -z "$IP" ]]; then
    echo "warning: Failed to find host IP address for development server. It will not be available for testing or reloading. To use the development server, please rebuild after ensuring that you have a valid IP address." >&2
  else
    IP_XIP="${IP}.xip.io"

    # Check that the $IP.xip.io domain resolves.
    lookup=`dig +short $IP_XIP`
    if [[ -z "$lookup" ]]; then
      # A simple numeric IP address is blocked by Apple's App Transport Security.
      echo "warning: The domain ${IP_XIP} cannot be resolved.  If your device cannot resolve this domain, it may be unable to connect to the development server through wi-fi." >&2
    fi

    IP="${IP_XIP}"
    echo "$IP" > "$DEST/ip.txt"
  
    ip_exception=$($PLISTBUDDY -c "Print NSAppTransportSecurity:NSExceptionDomains:$IP:NSTemporaryExceptionAllowsInsecureHTTPLoads" "$PLIST")
    if [[ "$ip_exception" = "true" ]]; then
      echo "Confirmed '$IP' exception for App Transport Security in $PLIST"
    else
      echo "Adding '$IP' exception for App Transport Security to $PLIST"
      $PLISTBUDDY -c "Add NSAppTransportSecurity:NSExceptionDomains:$IP:NSTemporaryExceptionAllowsInsecureHTTPLoads bool true" "$PLIST"
    fi
    
  fi

fi

$NODE_BINARY "$REACT_NATIVE_DIR/local-cli/cli.js" bundle \
  --entry-file index.ios.js \
  --platform ios \
  --dev $DEV \
  --reset-cache true \
  --bundle-output "$DEST/main.jsbundle" \
  --assets-dest "$DEST"
