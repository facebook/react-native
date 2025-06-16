#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

pushd ../..
./gradlew :packages:react-native:ReactAndroid:prepareNative3pDependencies
./gradlew :private:react-native-fantom:prepareNative3pDependencies
popd
