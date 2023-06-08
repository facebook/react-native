#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# shellcheck source=xplat/js/react-native-github/sdks/hermes-engine/utils/build-apple-framework.sh
CURR_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
. "${CURR_SCRIPT_DIR}/build-apple-framework.sh"

if [ ! -d destroot/Library/Frameworks/macosx/hermes.framework ]; then
    mac_deployment_target=$(get_mac_deployment_target)

    build_apple_framework "macosx" "x86_64;arm64" "$mac_deployment_target"
else
    echo "Skipping; Clean \"destroot\" to rebuild".
fi
