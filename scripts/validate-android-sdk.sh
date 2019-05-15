#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# This script validates that the Android SDK is installed correctly.
# This means setting ANDROID_HOME and adding its subdirectories to PATH.
# If the Android SDK is not installed correctly, this script exits
# with an error and a helpful message is printed.

if [ -z "$ANDROID_HOME" ]; then
  echo "Error: \$ANDROID_HOME is not configured."
  echo "You must first install the Android SDK and then set \$ANDROID_HOME."
  echo "If you already installed the Android SDK, the problem is that you need to export ANDROID_HOME from your .bashrc or equivalent."
  echo "See https://facebook.github.io/react-native/docs/getting-started.html for instructions."
  exit 1
fi

if [ ! -d "$ANDROID_HOME" ]; then
  echo "Error: \$ANDROID_HOME = $ANDROID_HOME but that directory does not exist."
  echo "It is possible that you installed then uninstalled the Android SDK."
  echo "In that case, you should reinstall it."
  echo "See https://facebook.github.io/react-native/docs/getting-started.html for instructions."
  exit 1
fi

if [ ! -e "$ANDROID_HOME/emulator/emulator-headless" ]; then
  echo "Error: could not find an emulator-headless at \$ANDROID_HOME/emulator/emulator-headless."
  echo "Specifically, $ANDROID_HOME/emulator/emulator-headless does not exist."
  echo "This indicates something is borked with your Android SDK install."
  echo "One possibility is that you have \$ANDROID_HOME set to the wrong value."
  echo "If that seems correct, you might want to try reinstalling the Android SDK."
  echo "See https://facebook.github.io/react-native/docs/getting-started.html for instructions."
  exit 1
fi

if [ -z `which emulator-headless` ]; then
  echo "Error: could not find 'emulator-headless'. Specifically, 'which emulator-headless' was empty."
  echo "However, the emulator-headless seems to be installed at \$ANDROID_HOME/emulator/emulator-headless already."
  echo "This means that the problem is that you are not adding \$ANDROID_HOME/emulator/emulator-headless to your \$PATH."
  echo "You should do that, and then rerun this command."
  echo "Sorry for not fixing this automatically - we just didn't want to mess with your \$PATH automatically because that can break things."
  exit 1
fi

if [ -z `which adb` ]; then
  echo "Error: could not find 'adb'. Specifically, 'which adb' was empty."
  echo "This indicates something is borked with your Android SDK install."
  echo "The most likely problem is that you are not adding \$ANDROID_HOME/platform-tools to your \$PATH."
  echo "If all else fails, try reinstalling the Android SDK."
  echo "See https://facebook.github.io/react-native/docs/getting-started.html for instructions."
  exit 1
fi

