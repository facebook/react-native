#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e
set -u

THIS_DIR=$(cd -P "$(dirname "$(realpath "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

SETUP_ENV_VARS_PATH="$BUCK_PROJECT_ROOT/env-utils/setup_env_vars.sh"

# Somehow this path this doesn't work in BUCK1, so falling back to the exisiting path that we use in BUCK1.
if [ ! -f "${SETUP_ENV_VARS_PATH}" ]; then
  SETUP_ENV_VARS_PATH="$BUCK_PROJECT_ROOT/xplat/js/env-utils/setup_env_vars.sh"
fi

# shellcheck source=xplat/js/env-utils/setup_env_vars.sh
source "${SETUP_ENV_VARS_PATH}"

pushd "$JS_DIR" >/dev/null
  "$INSTALL_NODE_MODULES"
popd >/dev/null

exec "$FLOW_NODE_BINARY" "$THIS_DIR/combine-js-to-schema-cli.js" "$@"
