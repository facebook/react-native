#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script assumes yarn is already installed.

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

set -e
set -u

CODEGEN_DIR="$THIS_DIR/../.."

rm -rf "${CODEGEN_DIR:?}/lib" "${CODEGEN_DIR:?}/node_modules"

# Fallback to npm if yarn is not available
if [ -x "$(command -v yarn)" ]; then
  YARN_OR_NPM=$(command -v yarn)
else
  YARN_OR_NPM=$(command -v npm)
fi
YARN_BINARY="${YARN_BINARY:-$YARN_OR_NPM}"

if [[ ${FBSOURCE_ENV:-0} -eq 1 ]]; then
  # Custom FB-specific setup
  pushd "$CODEGEN_DIR" >/dev/null

  "$YARN_BINARY" install 2> >(grep -v '^warning' 1>&2)
  # Note: Within FBSOURCE_ENV, this has to explicitly run build.
  "$YARN_BINARY" run build

  popd >/dev/null
else
  # Run yarn install in a separate tmp dir to avoid conflict with the rest of the repo.
  # Note: OSS-only.
  TMP_DIR=$(mktemp -d)

  cp -R "$CODEGEN_DIR/." "$TMP_DIR"

  pushd "$TMP_DIR" >/dev/null

  # Note: this automatically runs build as well.
  "$YARN_BINARY" install 2> >(grep -v '^warning' 1>&2)

  popd >/dev/null

  mv "$TMP_DIR/lib" "$TMP_DIR/node_modules" "$CODEGEN_DIR"
  rm -rf "$TMP_DIR"
fi
