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
# - MODULES_LIBRARY_NAME: Defaults to FBReactNativeSpec
# - MODULES_OUTPUT_DIR: Defaults to React/$MODULES_LIBRARY_NAME/$MODULES_LIBRARY_NAME
# - COMPONENTS_LIBRARY_NAME: Defaults to rncore
# - COMPONENTS_OUTPUT_DIR: Defaults to ReactCommon/react/renderer/components/$COMPONENTS_LIBRARY_NAME
#
# Usage:
#   ./scripts/generate-specs.sh
#   SRCS_DIR=myapp/js MODULES_LIBRARY_NAME=MySpecs MODULES_OUTPUT_DIR=myapp/MySpecs ./scripts/generate-specs.sh
#

# shellcheck disable=SC2038

set -e

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
TEMP_DIR=$(mktemp -d /tmp/react-native-codegen-XXXXXXXX)
RN_DIR=$(cd "$THIS_DIR/.." && pwd)
USE_FABRIC="${USE_FABRIC:-0}"

# Find path to Node
# shellcheck source=/dev/null
source "$RN_DIR/scripts/find-node.sh"

NODE_BINARY="${NODE_BINARY:-$(command -v node || true)}"

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
  MODULES_LIBRARY_NAME=${MODULES_LIBRARY_NAME:-FBReactNativeSpec}

  COMPONENTS_LIBRARY_NAME=${COMPONENTS_LIBRARY_NAME:-rncore}
  MODULES_OUTPUT_DIR=${MODULES_OUTPUT_DIR:-"$RN_DIR/React/$MODULES_LIBRARY_NAME/$MODULES_LIBRARY_NAME"}
  # TODO: $COMPONENTS_PATH should be programmatically specified, and may change with use_frameworks! support.
  COMPONENTS_PATH="ReactCommon/react/renderer/components"
  COMPONENTS_OUTPUT_DIR=${COMPONENTS_OUTPUT_DIR:-"$RN_DIR/$COMPONENTS_PATH/$COMPONENTS_LIBRARY_NAME"}

  TEMP_OUTPUT_DIR="$TEMP_DIR/out"
  SCHEMA_FILE="$TEMP_DIR/schema.json"

  CODEGEN_REPO_PATH="$RN_DIR/packages/react-native-codegen"
  CODEGEN_NPM_PATH="$RN_DIR/../react-native-codegen"

  if [ -z "$NODE_BINARY" ]; then
    echo "Error: Could not find node. Make sure it is in bash PATH or set the NODE_BINARY environment variable." 1>&2
    exit 1
  fi

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
    bash "$CODEGEN_PATH/scripts/oss/build.sh"
  fi

  describe "Generating schema from flow types"
  "$NODE_BINARY" "$CODEGEN_PATH/lib/cli/combine/combine-js-to-schema-cli.js" "$SCHEMA_FILE" "$SRCS_DIR"

  describe "Generating native code from schema (iOS)"
  pushd "$RN_DIR" >/dev/null || exit 1
    "$NODE_BINARY" scripts/generate-specs-cli.js ios "$SCHEMA_FILE" "$TEMP_OUTPUT_DIR" "$MODULES_LIBRARY_NAME"
  popd >/dev/null || exit 1

  describe "Copying output to final directory"
  mkdir -p "$COMPONENTS_OUTPUT_DIR" "$MODULES_OUTPUT_DIR"
  cp -R "$TEMP_OUTPUT_DIR/$MODULES_LIBRARY_NAME.h" "$TEMP_OUTPUT_DIR/$MODULES_LIBRARY_NAME-generated.mm" "$MODULES_OUTPUT_DIR" || exit 1
  find "$TEMP_OUTPUT_DIR" -type f | xargs sed -i.bak "s/$MODULES_LIBRARY_NAME/$COMPONENTS_LIBRARY_NAME/g" || exit 1
  find "$TEMP_OUTPUT_DIR" -type f -not -iname "$MODULES_LIBRARY_NAME*" -exec cp '{}' "$COMPONENTS_OUTPUT_DIR/" ';' || exit 1

  echo >&2 'Done.'
}

trap cleanup EXIT
main "$@"
