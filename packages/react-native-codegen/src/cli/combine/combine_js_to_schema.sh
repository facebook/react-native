#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e
set -u

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

# shellcheck source=xplat/js/env-utils/setup_env_vars.sh
source "$THIS_DIR/../../../../../../env-utils/setup_env_vars.sh"

pushd "$JS_DIR" >/dev/null
  "$INSTALL_NODE_MODULES"
popd >/dev/null

exec "$FLOW_NODE_BINARY" "$THIS_DIR/combine-js-to-schema-cli.js" "$@"
