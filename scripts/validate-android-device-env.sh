#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# This script validates that the Android environment is set up to run
# tests on a device or emulator (as opposed to a plain Java environment).

# This requires that the Android NDK is set up correctly and it also
# requires that you are currently either running an emulator or have
# an Android device plugged in.

if [ -z "$ANDROID_NDK" ]; then
  echo "Error: \$ANDROID_NDK is not configured."
  echo "You must first install the Android NDK and then set \$ANDROID_NDK."
  echo "If you already installed the Android SDK, well, the NDK is a different thing that you also need to install."
  echo "See https://facebook.github.io/react-native/docs/android-building-from-source.html for instructions."
  exit 1
fi

if [ -z "$(adb get-state)" ]; then
  echo "Error: you must either run an emulator or connect a device."
  echo "You can check what devices are running with 'adb get-state'."
  echo "You can run scripts/run-android-emulator.sh to get a known-good emulator config."
  exit 1
fi

while :
do
    BOOTANIM=$(adb -e shell getprop init.svc.bootanim)
    # shellcheck disable=SC2143
    if [[ -n $(echo "$BOOTANIM" | grep stopped) ]]; then
        break
    fi
    echo "Waiting for the emulator to finish booting..."
    sleep 3
done
