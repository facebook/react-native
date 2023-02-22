#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Runs an Android emulator locally.
# If there already is a running emulator, this just uses that.
# The only reason to use this config is that it represents a known-good
# virtual device configuration.
# This is useful for running integration tests on a local machine.

THIS_DIR=$(cd -P "$(dirname "$(realpath "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

STATE=`adb get-state`

if [ -n "$STATE" ]; then
    echo "An emulator is already running."
    exit 1
fi

echo "Installing packages"
source "${THIS_DIR}/android-setup.sh" && getAndroidPackages

echo "Creating Android virtual device..."
source "${THIS_DIR}/android-setup.sh" && createAVD

echo "Launching Android virtual device..."
source "${THIS_DIR}/android-setup.sh" && launchAVD
