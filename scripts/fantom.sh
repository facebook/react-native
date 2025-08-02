#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e


if [[ -f "BUCK" && -z "$FANTOM_FORCE_OSS_BUILD" ]]; then
  export JS_DIR='..'
else
  yarn workspace @react-native/fantom build
  export FANTOM_FORCE_OSS_BUILD=1
fi

export NODE_OPTIONS='--max-old-space-size=8192'

yarn jest --config private/react-native-fantom/config/jest.config.js "$@"
