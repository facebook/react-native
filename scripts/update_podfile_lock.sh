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

update_pods () {
  cd "$RNTESTER_DIR" || exit
  bundle check || exit
  bundle exec pod install
  cd "$THIS_DIR" || exit
}
