#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script collects the JavaScript spec definitions for core
# native modules and components, then uses react-native-codegen
# to generate native code.
#
# Optionally, set these envvars to override defaults:
# - SRCS_DIR: Path to JavaScript sources
# - CODEGEN_MODULES_LIBRARY_NAME: Defaults to FBReactNativeSpec
# - CODEGEN_MODULES_OUTPUT_DIR: Defaults to Libraries/$CODEGEN_MODULES_LIBRARY_NAME/$CODEGEN_MODULES_LIBRARY_NAME
# - CODEGEN_COMPONENTS_LIBRARY_NAME: Defaults to rncore
# - CODEGEN_COMPONENTS_OUTPUT_DIR: Defaults to ReactCommon/react/renderer/components/$CODEGEN_COMPONENTS_LIBRARY_NAME
#
# Usage:
#   ./scripts/generate-specs.sh
#   SRCS_DIR=myapp/js CODEGEN_MODULES_LIBRARY_NAME=MySpecs CODEGEN_MODULES_OUTPUT_DIR=myapp/MySpecs ./scripts/generate-specs.sh
#

# shellcheck disable=SC2038

set -e

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
TEMP_DIR=$(mktemp -d /tmp/react-native-codegen-XXXXXXXX)
RN_DIR=$(cd "$THIS_DIR/.." && pwd)
YARN_BINARY="${YARN_BINARY:-$(command -v yarn)}"
USE_FABRIC="${USE_FABRIC:-0}"

cleanup () {
  set +e
  rm -rf "$TEMP_DIR"
  set -e
}

describe () {
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1"
}

main() {
  SRCS_DIR=${SRCS_DIR:-$(cd "$RN_DIR/Libraries" && pwd)}
  CODEGEN_MODULES_LIBRARY_NAME=${CODEGEN_MODULES_LIBRARY_NAME:-FBReactNativeSpec}

  CODEGEN_COMPONENTS_LIBRARY_NAME=${CODEGEN_COMPONENTS_LIBRARY_NAME:-rncore}
  CODEGEN_MODULES_OUTPUT_DIR=${CODEGEN_MODULES_OUTPUT_DIR:-"$RN_DIR/Libraries/$CODEGEN_MODULES_LIBRARY_NAME/$CODEGEN_MODULES_LIBRARY_NAME"}
  # TODO: $CODEGEN_COMPONENTS_PATH should be programmatically specified, and may change with use_frameworks! support.
  CODEGEN_COMPONENTS_PATH="ReactCommon/react/renderer/components"
  CODEGEN_COMPONENTS_OUTPUT_DIR=${CODEGEN_COMPONENTS_OUTPUT_DIR:-"$RN_DIR/$CODEGEN_COMPONENTS_PATH/$CODEGEN_COMPONENTS_LIBRARY_NAME"}

  TEMP_OUTPUT_DIR="$TEMP_DIR/out"
  SCHEMA_FILE="$TEMP_DIR/schema.json"

  CODEGEN_REPO_PATH="$RN_DIR/packages/react-native-codegen"
  CODEGEN_NPM_PATH="$RN_DIR/../react-native-codegen"

  if [ -d "$CODEGEN_REPO_PATH" ]; then
    CODEGEN_PATH=$(cd "$CODEGEN_REPO_PATH" && pwd)
  elif [ -d "$CODEGEN_NPM_PATH" ]; then
    CODEGEN_PATH=$(cd "$CODEGEN_NPM_PATH" && pwd)
  else
    echo "Error: Could not determine react-native-codegen location. Try running 'yarn install' or 'npm install' in your project root." 1>&2
    exit 1
  fi

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
    "$YARN_BINARY" --silent node scripts/generate-specs-cli.js ios "$SCHEMA_FILE" "$TEMP_OUTPUT_DIR" "$CODEGEN_MODULES_LIBRARY_NAME"
  popd >/dev/null || exit

  mkdir -p "$CODEGEN_COMPONENTS_OUTPUT_DIR" "$CODEGEN_MODULES_OUTPUT_DIR"
  mv "$TEMP_OUTPUT_DIR/$CODEGEN_MODULES_LIBRARY_NAME.h" "$TEMP_OUTPUT_DIR/$CODEGEN_MODULES_LIBRARY_NAME-generated.mm" "$CODEGEN_MODULES_OUTPUT_DIR"
  find "$TEMP_OUTPUT_DIR" -type f | xargs sed -i '' "s/$CODEGEN_MODULES_LIBRARY_NAME/$CODEGEN_COMPONENTS_LIBRARY_NAME/g"
  cp -R "$TEMP_OUTPUT_DIR/." "$CODEGEN_COMPONENTS_OUTPUT_DIR"
}

trap cleanup EXIT
main "$@"
