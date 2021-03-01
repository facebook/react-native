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
# - CODEGEN_MODULES_OUTPUT_DIR: Defaults to React/$CODEGEN_MODULES_LIBRARY_NAME/$CODEGEN_MODULES_LIBRARY_NAME
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

# find node path
source "$RN_DIR/scripts/find-node.sh"

NODE_BINARY="${NODE_BINARY:-$(command -v node || true)}"
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
  CODEGEN_MODULES_OUTPUT_DIR=${CODEGEN_MODULES_OUTPUT_DIR:-"$RN_DIR/React/$CODEGEN_MODULES_LIBRARY_NAME/$CODEGEN_MODULES_LIBRARY_NAME"}
  # TODO: $CODEGEN_COMPONENTS_PATH should be programmatically specified, and may change with use_frameworks! support.
  CODEGEN_COMPONENTS_PATH="ReactCommon/react/renderer/components"
  CODEGEN_COMPONENTS_OUTPUT_DIR=${CODEGEN_COMPONENTS_OUTPUT_DIR:-"$RN_DIR/$CODEGEN_COMPONENTS_PATH/$CODEGEN_COMPONENTS_LIBRARY_NAME"}

  TEMP_OUTPUT_DIR="$TEMP_DIR/out"
  SCHEMA_FILE="$TEMP_DIR/schema.json"

  if [ -z "$NODE_BINARY" ]; then
    echo "Error: Could not find node. Make sure it is in bash PATH or set the NODE_BINARY environment variable." 1>&2
    exit 1
  fi

  CODEGEN_PATH=$("$NODE_BINARY" -e "console.log(require('path').dirname(require.resolve('react-native-codegen/package.json')))")

  # Special case for running CodeGen from source: build it
  if [ ! -d "$CODEGEN_PATH/lib" ]; then
    describe "Building react-native-codegen package"
    bash "$CODEGEN_PATH/scripts/oss/build.sh"
  fi

  describe "Generating schema from flow types"
  "$NODE_BINARY" "$CODEGEN_PATH/lib/cli/combine/combine-js-to-schema-cli.js" "$SCHEMA_FILE" "$SRCS_DIR"

  describe "Generating native code from schema (iOS)"
  pushd "$RN_DIR" >/dev/null || exit 1
    "$NODE_BINARY" scripts/generate-specs-cli.js ios "$SCHEMA_FILE" "$TEMP_OUTPUT_DIR" "$CODEGEN_MODULES_LIBRARY_NAME"
  popd >/dev/null || exit 1

  describe "Copying output to final directory"
  mkdir -p "$CODEGEN_COMPONENTS_OUTPUT_DIR" "$CODEGEN_MODULES_OUTPUT_DIR"
  cp -R "$TEMP_OUTPUT_DIR/$CODEGEN_MODULES_LIBRARY_NAME.h" "$TEMP_OUTPUT_DIR/$CODEGEN_MODULES_LIBRARY_NAME-generated.mm" "$CODEGEN_MODULES_OUTPUT_DIR" || exit 1
  find "$TEMP_OUTPUT_DIR" -type f | xargs sed -i.bak "s/$CODEGEN_MODULES_LIBRARY_NAME/$CODEGEN_COMPONENTS_LIBRARY_NAME/g" || exit 1
  find "$TEMP_OUTPUT_DIR" -type f -not -iname "$CODEGEN_MODULES_LIBRARY_NAME*" -exec cp '{}' "$CODEGEN_COMPONENTS_OUTPUT_DIR/" ';' || exit 1

  echo >&2 'Done.'
}

trap cleanup EXIT
main "$@"
