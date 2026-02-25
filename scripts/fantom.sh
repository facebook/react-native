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

# Parse arguments to check for --benchmarks flag
INCLUDE_BENCHMARKS=false
ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--benchmarks" ]]; then
    INCLUDE_BENCHMARKS=true
  else
    ARGS+=("$arg")
  fi
done

# When --benchmarks is passed, set env var so jest.config.js includes benchmark tests
if [[ "$INCLUDE_BENCHMARKS" == true ]]; then
  FANTOM_INCLUDE_BENCHMARKS=1 yarn jest --config private/react-native-fantom/config/jest.config.js "${ARGS[@]}"
else
  yarn jest --config private/react-native-fantom/config/jest.config.js "${ARGS[@]}"
fi
