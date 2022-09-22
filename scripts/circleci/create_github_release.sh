#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

ARTIFACTS=("$@")

describe_header () {
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1"
}

describe () {
  printf "\\n\\n%s\\n\\n" "$1"
}

# Upload artifacts
for ARTIFACT_PATH in "${ARTIFACTS[@]}"
do
    :
    # Upload Hermes artifacts to GitHub Release
    ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
    describe_header "(would have been) Uploading $ARTIFACT_NAME... (from $ARTIFACT_PATH, content-length $(wc -c $ARTIFACT_PATH | awk '{print $1}'))"
    describe "(would have) Uploaded $ARTIFACT_NAME."
done
