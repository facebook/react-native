#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x

src="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/${PLATFORM_NAME}/hermes.framework"

if [[ ! -e "$src" ]]; then
  echo "$src does not exist."
  exit 1
fi

dst1="${PODS_XCFRAMEWORKS_BUILD_DIR}/hermes"
[ ! -f "$dst1" ] && mkdir -p "$dst1"
cp -R "$src" "$dst1"

dst2="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}"
[ ! -f "$dst2" ] && mkdir -p "$dst2"
cp -R "$src" "$dst2"
