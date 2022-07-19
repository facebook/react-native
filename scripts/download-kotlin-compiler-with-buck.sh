#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

buck fetch //ReactAndroid/src/main/third-party/kotlin:kotlin-compiler-download

BUCK_OUTPUT_FOLDER=$(buck build //ReactAndroid/src/main/third-party/kotlin:kotlin-compiler-download --show-output -v 0 | sed -E 's/^(.*) (.*)$/\2/g')

mkdir -p "$KOTLIN_HOME"
cp -R "$BUCK_OUTPUT_FOLDER/." "$KOTLIN_HOME"
