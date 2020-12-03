#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script collects the JavaScript spec definitions for core
# native modules, then uses react-native-codegen to generate
# native code.
# The script will use the local react-native-codegen package by
# default. Optionally, set the CODEGEN_PATH to point to the
# desired codegen library (e.g. when using react-native-codegen
# from npm).
#
# Usage:
#   ./scripts/generate-native-modules-specs.sh
#
# Example:
#  CODEGEN_PATH=.. ./scripts/generate-native-modules-specs.sh

# shellcheck disable=SC2038

set -e

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
TEMP_DIR=$(mktemp -d /tmp/react-native-codegen-XXXXXXXX)
RN_DIR=$(cd "$THIS_DIR/.." && pwd)
CODEGEN_PATH="${CODEGEN_PATH:-$(cd "$RN_DIR/packages/react-native-codegen" && pwd)}"
YARN_BINARY="${YARN_BINARY:-$(command -v yarn)}"

cleanup () {
  set +e
  rm -rf "$TEMP_DIR"
  set -e
}

describe () {
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1"
}

run_codegen () {
  SRCS_DIR=$1
  LIBRARY_NAME=$2
  OUTPUT_DIR=$3

  SCHEMA_FILE="$TEMP_DIR/schema-$LIBRARY_NAME.json"

  if [ ! -d "$CODEGEN_PATH/lib" ]; then
    describe "Building react-native-codegen package"
    pushd "$CODEGEN_PATH" >/dev/null || exit
      "$YARN_BINARY"
      "$YARN_BINARY" build
    popd >/dev/null || exit
  fi

  describe "Generating schema from flow types"
  "$YARN_BINARY" node "$CODEGEN_PATH/lib/cli/combine/combine-js-to-schema-cli.js" "$SCHEMA_FILE" "$SRCS_DIR"

  describe "Generating native code from schema (iOS)"
  pushd "$RN_DIR" >/dev/null || exit
    "$YARN_BINARY" --silent node scripts/generate-native-modules-specs-cli.js ios "$SCHEMA_FILE" "$OUTPUT_DIR"
  popd >/dev/null || exit
}

# Handle Core Modules
run_codegen_core_modules () {
  LIBRARY_NAME="FBReactNativeSpec"
  SRCS_DIR=$(cd "$RN_DIR/Libraries" && pwd)
  OUTPUT_DIR="$SRCS_DIR/$LIBRARY_NAME/$LIBRARY_NAME"

  run_codegen "$SRCS_DIR" "$LIBRARY_NAME" "$OUTPUT_DIR"
}

main() {
  run_codegen_core_modules
}

trap cleanup EXIT
main "$@"
