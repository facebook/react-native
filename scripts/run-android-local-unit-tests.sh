#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Runs all Android unit tests locally.
# See http://facebook.github.io/react-native/docs/testing.html

source $(dirname $0)/validate-android-sdk.sh
source $(dirname $0)/validate-android-test-env.sh

set -e

echo "Fetching dependencies..."
buck fetch ReactAndroid/src/test/...

echo "Running unit tests..."
buck test ReactAndroid/src/test/...
