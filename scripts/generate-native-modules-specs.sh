#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script collects the JavaScript spec definitions for native
# modules, then uses react-native-codegen to generate native code.
# The script will copy the generated code to the final location by
# default. Optionally, call the script with a path to the desired
# output location.
#
# Usage:
#   ./scripts/generate-native-modules-specs.sh [output-dir]
#
# Example:
#   ./scripts/generate-native-modules-specs.sh ./codegen-out

# shellcheck disable=SC2038

set -e

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
RN_DIR=$(cd "$THIS_DIR/.." && pwd)
CODEGEN_DIR=$(cd "$RN_DIR/packages/react-native-codegen" && pwd)
OUTPUT_DIR="${1:-$RN_DIR/Libraries/FBReactNativeSpec/FBReactNativeSpec}"
SCHEMA_FILE="$RN_DIR/schema-native-modules.json"
YARN_BINARY="${YARN_BINARY:-yarn}"

describe () {
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1"
}

step_build_codegen () {
  describe "Building react-native-codegen package"
  pushd "$CODEGEN_DIR" >/dev/null || exit
    "$YARN_BINARY"
    "$YARN_BINARY" build
  popd >/dev/null || exit
}

step_gen_schema () {
  describe "Generating schema from flow types"
  SRCS_DIR=$(cd "$RN_DIR/Libraries" && pwd)
  grep --exclude NativeSampleTurboModule.js --exclude NativeUIManager.js --include=Native\*.js -rnwl "$SRCS_DIR" -e 'export interface Spec extends TurboModule' -e "export default \(TurboModuleRegistry.get(Enforcing)?<Spec>\('.*\): Spec\);/" \
    | xargs "$YARN_BINARY" node "$CODEGEN_DIR/lib/cli/combine/combine-js-to-schema-cli.js" "$SCHEMA_FILE"
}

step_gen_specs () {
  describe "Generating native code from schema (iOS)"
  "$YARN_BINARY" --silent node scripts/generate-native-modules-specs-cli.js ios "$SCHEMA_FILE" "$OUTPUT_DIR"
}

step_build_codegen
step_gen_schema
step_gen_specs
