#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -ex

buck fetch packages/react-native/ReactAndroid/src/test/java/com/facebook/react/modules
buck fetch packages/react-native/ReactAndroid/src/main/java/com/facebook/react
buck fetch packages/react-native/ReactAndroid/src/main/java/com/facebook/react/shell
buck fetch packages/react-native/ReactAndroid/src/test/...
buck fetch packages/react-native/ReactAndroid/src/androidTest/...
