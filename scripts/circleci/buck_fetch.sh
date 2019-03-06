#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -ex

buck fetch ReactAndroid/src/test/java/com/facebook/react/modules
buck fetch ReactAndroid/src/main/java/com/facebook/react
buck fetch ReactAndroid/src/main/java/com/facebook/react/shell
buck fetch ReactAndroid/src/test/...
buck fetch ReactAndroid/src/androidTest/...
