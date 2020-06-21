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

describe () {
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1"
}

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
RN_DIR=$(cd "$THIS_DIR/.." && pwd)

SRCS_DIR=$(cd "$RN_DIR/Libraries" && pwd)
SCHEMA_FILE="$RN_DIR/schema-native-modules.json"

if [ -n "$1" ]; then
  OUTPUT_DIR="$1"
fi

pushd "$RN_DIR/packages/react-native-codegen" >/dev/null
  yarn
  yarn build
popd >/dev/null

describe "Generating schema from flow types"
grep --exclude NativeUIManager.js --include=Native\*.js -rnwl "$SRCS_DIR" -e 'export interface Spec extends TurboModule' -e "export default \(TurboModuleRegistry.get(Enforcing)?<Spec>\('.*\): Spec\);/" \
  | xargs yarn node packages/react-native-codegen/lib/cli/combine/combine-js-to-schema-cli.js "$SCHEMA_FILE"

describe "Generating native code from schema"
yarn node scripts/generate-native-modules-specs-cli.js "$SCHEMA_FILE" "$OUTPUT_DIR"
