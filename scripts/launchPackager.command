#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Set terminal title
echo -en "\\033]0;Metro\\a"
clear

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

export PODS_ROOT="$THIS_DIR/../../../ios/Pods"
WITH_ENVIRONMENT="$THIS_DIR/xcode/with-environment.sh"
source $WITH_ENVIRONMENT

# export packager environment variables
source "$THIS_DIR/.packager.env"

if [ -n "${RCT_PACKAGER_LOGS_DIR}" ] ; then
  echo "Writing logs to $RCT_PACKAGER_LOGS_DIR"
  # shellcheck source=/dev/null
  RCT_PACKAGER_LOG_PATH="$RCT_PACKAGER_LOGS_DIR/metro.log" \
  . "$THIS_DIR/packager.sh" \
    > "$RCT_PACKAGER_LOGS_DIR/packager.stdout.log" \
    2> "$RCT_PACKAGER_LOGS_DIR/packager.stderr.log"
else
  # shellcheck source=/dev/null
  . "$THIS_DIR/packager.sh"
fi
if [[ -z "$CI" ]]; then
  echo "Process terminated. Press <enter> to close the window"
  read -r
fi
