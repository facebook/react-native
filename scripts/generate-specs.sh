#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script collects the JavaScript spec definitions for
# native modules and components, then uses react-native-codegen
# to generate native code.
#
# Usage:
#   ./scripts/generate-specs.sh
#

# shellcheck disable=SC2038

set -e

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
TEMP_DIR=$(mktemp -d /tmp/react-native-codegen-XXXXXXXX)
RN_DIR=$(cd "$THIS_DIR/.." && pwd)

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
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1" >&2
}

print_usage () {
  printf "\\nNAME\\n\\t%s -- generate specs\\n" "$1" >&2
  printf "\\nSYNOPSIS\\n" >&2
  printf "\\t%s javascript_sources_directory specs_library_name output_directory\\n" "$1" >&2
  printf "\\t%s javascript_sources_directory specs_library_name output_directory component_library_name [component_output_directory]\\n" "$1" >&2
  printf "\\n\\nDESCRIPTION\\n\\tIn the first synopsis form, this script collects native module and native component JavaScript spec definitions in javascript_sources_directory, then uses react-native-codegen to generate the native interface code into a library named specs_library_name, which is copied to the destination output_directory.\\n" >&2
  printf "\\n\\tIn the second synopsis form, the component_library_name will be used as the name of the component native interface code library. If provided, the component output will be copied to the component_output_directory, otherwise it will be copied to the output_directory.\\n" >&2
}

main() {
  MIN_ARG_NUM=3
  if [ "$#" -eq 0 ]; then
    print_usage "$0"
    exit 1
  fi

  if [ -z "$NODE_BINARY" ]; then
    echo "Error: Could not find node. Make sure it is in bash PATH or set the NODE_BINARY environment variable." 1>&2
    exit 1
  fi

  if [ "$#" -lt "$MIN_ARG_NUM" ]; then
    echo "Error: Expected $MIN_ARG_NUM arguments, got $# instead. Run $0 with no arguments to learn more." 1>&2
    exit 1
  fi

  SRCS_DIR=$1
  LIBRARY_NAME=$2
  OUTPUT_DIR=$3
  COMPONENT_LIBRARY_NAME_OVERRIDE=$4
  COMPONENT_OUTPUT_DIR_OVERRIDE=$5

  PLATFORM="ios"
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
    bash "$CODEGEN_PATH/scripts/oss/build.sh"
  fi

  describe "Generating schema from Flow types"
  "$NODE_BINARY" "$CODEGEN_PATH/lib/cli/combine/combine-js-to-schema-cli.js" "$SCHEMA_FILE" "$SRCS_DIR"

  describe "Generating native code from schema ($PLATFORM)"
  pushd "$RN_DIR" >/dev/null
    "$NODE_BINARY" scripts/generate-specs-cli.js "$PLATFORM" "$SCHEMA_FILE" "$TEMP_OUTPUT_DIR" "$LIBRARY_NAME"
  popd >/dev/null


  mkdir -p "$OUTPUT_DIR"

  if [ -z "$COMPONENT_LIBRARY_NAME_OVERRIDE" ]; then
    # Copy all output to output_dir
    cp -R "$TEMP_OUTPUT_DIR/" "$OUTPUT_DIR"
    echo >&2 "$LIBRARY_NAME output has been written to $OUTPUT_DIR:"
    ls -1 "$OUTPUT_DIR" 2>&1
  else
    # Copy modules output to output_dir
    cp "$TEMP_OUTPUT_DIR/$LIBRARY_NAME.h" "$TEMP_OUTPUT_DIR/$LIBRARY_NAME-generated.mm" "$OUTPUT_DIR"
    echo >&2 "$LIBRARY_NAME output has been written to $OUTPUT_DIR:"
    ls -1 "$OUTPUT_DIR" 2>&1

    # Rename library name used in components output files
    find "$TEMP_OUTPUT_DIR" -type f | xargs sed -i.bak "s/$LIBRARY_NAME/$COMPONENT_LIBRARY_NAME_OVERRIDE/g"

    if [ -n "$COMPONENT_OUTPUT_DIR_OVERRIDE" ]; then
      # Components codegen output to be moved to separate directory
      mkdir -p "$COMPONENT_OUTPUT_DIR_OVERRIDE"
      OUTPUT_DIR="$COMPONENT_OUTPUT_DIR_OVERRIDE"
    fi

    find "$TEMP_OUTPUT_DIR" -type f -not -iname "$LIBRARY_NAME.h" -not -iname "$LIBRARY_NAME-generated.mm" -not -iname "*.bak" -exec cp '{}' "$OUTPUT_DIR/" ';'
    echo >&2 "$COMPONENT_LIBRARY_NAME_OVERRIDE output has been written to $OUTPUT_DIR:"
    ls -1 "$OUTPUT_DIR" 2>&1
  fi

  echo >&2 'Done.'
}

trap cleanup EXIT
main "$@"
