#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e
set -u

THIS_DIR=$(cd -P "$(dirname "$(realpath "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

# shellcheck source=xplat/js/env-utils/setup_env_vars.sh
source "$THIS_DIR/../../../../../../env-utils/setup_env_vars.sh"

exec "$FLOW_NODE_BINARY" "$THIS_DIR/parser.js" "$@"
