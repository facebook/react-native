#!/bin/bash
#
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#

# set default environment variables
UNIT_TESTS_BUILD_THREADS="${UNIT_TESTS_BUILD_THREADS:-1}"

# for buck gen
mount -o remount,exec /dev/shm

set -x

# run unit tests
buck test ReactAndroid/src/test/... --config build.threads="$UNIT_TESTS_BUILD_THREADS"
