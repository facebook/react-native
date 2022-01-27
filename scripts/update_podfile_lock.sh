#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script updates RNTester Podfile.lock after verifying the CocoaPods environment.
# Usage:
#   source scripts/update_podfile_lock && update_pods

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
RNTESTER_DIR="$THIS_DIR/../packages/rn-tester"

# Note: Keep in sync with FB internal.
REQUIRED_COCOAPODS_VERSION="1.11.2" # [(macOS) FB was 1.10.1, agents are currently 1.11.2 ]

validate_env () {
  # Check that CocoaPods is working.
  if [ -z "$(command -v pod)" ]; then
    echo "You need to install CocoaPods."
    echo "See https://guides.cocoapods.org/using/getting-started.html#getting-started for instructions."
    exit 1
  fi

  # // [(macOS) Commenting this out to avoid hitting breaks everytime the agents images are updated
  # COCOAPODS_VERSION=$(pod --version)
  # if [[ "$COCOAPODS_VERSION" != "$REQUIRED_COCOAPODS_VERSION" ]];
  # then
  #   echo "You must have CocoaPods $REQUIRED_COCOAPODS_VERSION installed; you have $COCOAPODS_VERSION."
  #   echo "Installing via gem is recommended:"
  #   echo "  sudo gem install cocoapods -v $REQUIRED_COCOAPODS_VERSION"
  #   exit 1
  # fi
  # // macOS]
}

update_pods () {
  validate_env

  cd "$RNTESTER_DIR" || exit
  pod install
  cd "$THIS_DIR" || exit
}
