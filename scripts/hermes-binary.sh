#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

[ -z "$HERMES_PATH" ] && export HERMES_PATH="$REACT_NATIVE_DIR/../hermes-engine-darwin"

export HERMES_CLI = "$HERMES_PATH/destroot/bin/hermesc"

if [[ $USE_HERMES == true && ! -d "$HERMES_PATH" ]]; then
  echo "error: Can't find Hermes executable - directory `$HERMES_PATH` doesn't exist. " \
       "If you have a non-standard project structure, select your project in Xcode, find " \
       "'Build Phases' - 'Bundle React Native code and images' and set `HERMES_PATH` to an " \
       "absolute path to a `hermes-engine-darwin` package inside your `node_modules`" >&2
  exit 2
fi
