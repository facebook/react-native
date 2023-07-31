#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script checks if Appium server is running on default port (which is 4723).
if ! nc -z 127.0.0.1 4723; then
  echo Could not find Appium server.
  exit 1
fi
