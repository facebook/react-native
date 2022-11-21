#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x

source="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/${PLATFORM_NAME}/hermes.framework"

if [[ -f "$source" ]]; then
    cp -R "$source" "${PODS_XCFRAMEWORKS_BUILD_DIR}/hermes/hermes.framework"
    cp -R "$source" "${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}"
fi
