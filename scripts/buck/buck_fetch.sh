#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -ex

# Source: https://gist.github.com/sj26/88e1c6584397bb7c13bd11108a579746
# Modified to 1) address lint errors and 2) output to stderr.
#
# Retry a command up to a specific numer of times until it exits successfully,
# with exponential back off.
#
#  $ retry 5 echo Hello
#  Hello
#
#  $ retry 5 false
#  Retry 1/5 exited 1, retrying in 1 seconds...
#  Retry 2/5 exited 1, retrying in 2 seconds...
#  Retry 3/5 exited 1, retrying in 4 seconds...
#  Retry 4/5 exited 1, retrying in 8 seconds...
#  Retry 5/5 exited 1, no more retries left.
#
function retry {
  local retries=$1
  shift

  local count=0
  until "$@"; do
    exit=$?
    wait=$((2 ** count))
    count=$((count + 1))
    if [ $count -lt "$retries" ]; then
      echo "Retry $count/$retries exited $exit, retrying in $wait seconds..." >&2
      sleep $wait
    else
      echo "Retry $count/$retries exited $exit, no more retries left." >&2
      return $exit
    fi
  done
  return 0
}

CURRENT_DIR=$(pwd)
export KOTLIN_HOME="$CURRENT_DIR/third-party/kotlin"
retry 3 scripts/buck/download-kotlin-compiler-with-buck.sh

retry 3 buck fetch ReactAndroid/src/test/java/com/facebook/react/modules
retry 3 buck fetch ReactAndroid/src/main/java/com/facebook/react
retry 3 buck fetch ReactAndroid/src/main/java/com/facebook/react/shell
retry 3 buck fetch ReactAndroid/src/test/...
retry 3 buck fetch ReactAndroid/src/androidTest/...
