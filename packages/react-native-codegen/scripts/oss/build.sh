#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script assumes yarn is already installed.

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

set -e
set -u

TMP_DIR=$(mktemp -d)
CODEGEN_DIR="$THIS_DIR/../.."

rm -rf "$CODEGEN_DIR/lib"

cp -R "$CODEGEN_DIR/." "$TMP_DIR"

pushd "$TMP_DIR" >/dev/null

yarn install 2> >(grep -v '^warning' 1>&2)

popd >/dev/null

mv "$TMP_DIR/lib" "$CODEGEN_DIR"
rm -rf "$TMP_DIR"
