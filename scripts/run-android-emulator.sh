#!/bin/bash

# Runs an Android emulator locally.
# If there already is a running emulator, this just uses that.
# The only reason to use this config is that it represents a known-good
# virtual device configuration.
# This is useful for running integration tests on a local machine.
# TODO: make continuous integration use the precise same setup

STATE=`adb get-state`

if [ -n "$STATE" ]; then
    echo "An emulator is already running."
    exit 1
fi

echo "Creating virtual device..."
echo no | android create avd -n testAVD -f -t android-23 --abi default/x86
emulator -avd testAVD
