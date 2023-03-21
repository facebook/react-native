#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# inspired by https://github.com/Originate/guide/blob/master/android/guide/Continuous%20Integration.md

# shellcheck disable=SC1091
source "scripts/.tests.env"

# NOTE: This doesn't run in Circle CI currently!
function getAndroidPackages {
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools.bin:$PATH"

  DEPS="$ANDROID_HOME/installed-dependencies"

  # Package names can be obtained using `sdkmanager --list`
  if [ ! -e "$DEPS" ] || [ ! "$CI" ]; then
    echo "Installing Android API level $ANDROID_SYSTEM_IMAGE_API_LEVEL, Google APIs, $AVD_ABI system image..."
    sdkmanager "system-images;android-$ANDROID_SYSTEM_IMAGE_API_LEVEL;google_apis;$AVD_ABI"
    echo "Installing build SDK for Android API level $ANDROID_SDK_BUILD_API_LEVEL..."
    sdkmanager "platforms;android-$ANDROID_SDK_BUILD_API_LEVEL"
    echo "Installing target SDK for Android API level $ANDROID_SDK_TARGET_API_LEVEL..."
    sdkmanager "platforms;android-$ANDROID_SDK_TARGET_API_LEVEL"
    echo "Installing SDK build tools, revision $ANDROID_SDK_BUILD_TOOLS_REVISION..."
    sdkmanager "build-tools;$ANDROID_SDK_BUILD_TOOLS_REVISION"
    # These moved to "system-images;android-$ANDROID_SDK_BUILD_API_LEVEL;google_apis;x86" starting with API level 25, but there is no ARM version.
    echo "Installing Google APIs $ANDROID_GOOGLE_API_LEVEL..."
    sdkmanager "add-ons;addon-google_apis-google-$ANDROID_GOOGLE_API_LEVEL"
    echo "Installing Android Support Repository"
    sdkmanager "extras;android;m2repository"
    $CI && touch "$DEPS"
  fi
}

function getAndroidNDK {
  NDK_HOME="/opt/ndk"
  DEPS="$NDK_HOME/installed-dependencies"

  if [ ! -e $DEPS ]; then
    cd $NDK_HOME || exit
    echo "Downloading NDK..."
    curl -o ndk.zip https://dl.google.com/android/repository/android-ndk-r19c-linux-x86_64.zip
    unzip -o -q ndk.zip
    echo "Installed Android NDK at $NDK_HOME"
    touch $DEPS
    rm ndk.zip
  fi
}

function createAVD {
  if [ -z "$ANDROID_DISABLE_AVD_TESTS" ]
  then
    AVD_PACKAGES="system-images;android-$ANDROID_IMAGE_API_LEVEL;google_apis;$AVD_ABI"
    echo "Creating AVD with packages $AVD_PACKAGES"
    echo no | avdmanager create avd --name "$AVD_NAME" --force --package "$AVD_PACKAGES" --tag google_apis --abi "$AVD_ABI"
  else
    echo "Skipping AVD-related test setup..."
  fi
}

function launchAVD {
  # Force start adb server
  adb start-server

  if [ -z "$ANDROID_DISABLE_AVD_TESTS" ]
  then
    # The AVD name here should match the one created in createAVD
    if [ "$CI" ]
    then
      "$ANDROID_HOME/emulator/emulator" -avd "$AVD_NAME" -no-audio -no-window
    else
      "$ANDROID_HOME/emulator/emulator" -avd "$AVD_NAME"
    fi
  else
    echo "Skipping AVD-related test setup..."
  fi
}

function waitForAVD {
  if [ -z "$ANDROID_DISABLE_AVD_TESTS" ]
  then
    echo "Waiting for Android Virtual Device to finish booting..."
    local bootanim=""
    export PATH=$(dirname $(dirname $(command -v android)))/platform-tools:$PATH
    until [[ "$bootanim" =~ "stopped" ]]; do
      sleep 5
      bootanim=$(adb -e shell getprop init.svc.bootanim 2>&1)
      echo "boot animation status=$bootanim"
    done
    echo "Android Virtual Device is ready."
  else
    echo "Skipping AVD-related test setup..."
  fi
}
