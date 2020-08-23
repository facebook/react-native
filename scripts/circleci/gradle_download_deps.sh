#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

./gradlew :packages:react-native:ReactAndroid:downloadBoost :packages:react-native:ReactAndroid:downloadDoubleConversion :packages:react-native:ReactAndroid:downloadFolly :packages:react-native:ReactAndroid:downloadGlog
