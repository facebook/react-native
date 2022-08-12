#!/usr/bin/env bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

#
# Build script for `@react-native/event-emitter`. Run using `npm run build`.
#

set -e
set -u

ROOT_DIR=$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")

babel "$ROOT_DIR/src/EventEmitter.js" --out-dir "$ROOT_DIR/lib"
prettier "$ROOT_DIR/lib/EventEmitter.js" --write

cp "$ROOT_DIR/src/EventEmitter.js" "$ROOT_DIR/lib/EventEmitter.js.flow"
cp "$ROOT_DIR/src/EventEmitter.d.ts" "$ROOT_DIR/lib/EventEmitter.d.ts"
