#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

GIT_TAG="$1"; shift
GITHUB_OWNER="$1"; shift
GITHUB_REPO="$1"; shift
GITHUB_TOKEN="$1"; shift
ARTIFACTS=("$@")

describe_header () {
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1"
}

describe () {
  printf "\\n\\n%s\\n\\n" "$1"
}

# Format our desired React Native version strings based on incoming git tag parameter.
# GIT_TAG=v0.69.0-rc.4
# 0.69.0-rc.4
RN_VERSION=${GIT_TAG:1}
# 0690rc4
RN_SHORT_VERSION=${RN_VERSION//[.-]/}

PRERELEASE=false
if [[ "$RN_VERSION" == *"rc"* ]]; then
    PRERELEASE=true
fi

RELEASE_TEMPLATE_PATH=../../.github/RELEASE_TEMPLATE.md

# Replace placeholders in template with actual RN version strings
RELEASE_BODY=$(sed -e "s/__VERSION__/$RN_VERSION/g" -e "s/__SHORT_VERSION__/$RN_SHORT_VERSION/g" $RELEASE_TEMPLATE_PATH)

# Format and encode JSON payload
RELEASE_DATA=$(jo tag_name="$GIT_TAG" name="$RN_VERSION" body="$RELEASE_BODY" draft=true prerelease="$PRERELEASE" generate_release_notes=false)

# Create prerelease GitHub Release draft
describe_header "Creating GitHub release."
describe "Release payload: $RELEASE_DATA"

CREATE_RELEASE_RESPONSE=$(curl -X POST \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -d "$RELEASE_DATA" \
    "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases"
)
STATUS=$?
if [ $STATUS == 0 ]; then
  describe "Created GitHub release successfully."
else
  describe "Could not create GitHub release, request failed with $STATUS."
fi

RELEASE_ID=$(echo "$CREATE_RELEASE_RESPONSE" | jq '.id')

# Upload artifacts
for ARTIFACT_PATH in "${ARTIFACTS[@]}"
do
    :
    # Upload Hermes artifacts to GitHub Release
    ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
    describe_header "Uploading $ARTIFACT_NAME..."

    if curl -X POST \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Content-Length: $(wc -c "$ARTIFACT_PATH" | awk '{print $1}')" \
        -H "Content-Type: application/gzip" \
        -T "$ARTIFACT_PATH" \
        --progress-bar \
        "https://uploads.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases/$RELEASE_ID/assets?name=$ARTIFACT_NAME"; then
        describe "Uploaded $ARTIFACT_NAME."
    else
        describe "Could not upload $ARTIFACT_NAME to GitHub release."
    fi
done
