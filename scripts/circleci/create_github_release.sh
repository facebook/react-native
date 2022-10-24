#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script creates a draft GitHub Release using RELEASE_TEMPLATE.md
# as a template and will upload the provided artifacts to the release.

# Install dependencies:
# apt update && apt install -y jq jo

THIS_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REACT_NATIVE_PATH="$THIS_DIR/../.."

GITHUB_OWNER=${CIRCLE_PROJECT_USERNAME:-facebook}
GITHUB_REPO=${CIRCLE_PROJECT_REPONAME:-react-native}

RELEASE_TYPE="$1"; shift
GIT_TAG="$1"; shift
RELEASE_VERSION="$1"; shift
GITHUB_TOKEN="$1"; shift
ARTIFACTS=("$@")

describe_header () {
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1"
}

describe () {
  printf "\\n\\n%s\\n\\n" "$1"
}

echoerr () {
  echo "$@" 1>&2
}

if [[ $RELEASE_TYPE == "release" ]]; then
  describe_header "Preparing to create a GitHub release."
elif [[ $RELEASE_TYPE == "dry-run" ]]; then
  describe_header "Preparing to create a GitHub release as a dry-run."
elif [[ $RELEASE_TYPE == "nightly" ]]; then
  describe "GitHub Releases are not used with nightlies. Skipping."
  exit 0
else
  echoerr "Unrecognized release type: $RELEASE_TYPE"
  exit 1
fi

# Derive short version string for use in the sample command used
# to create a new RN app in RELEASE_TEMPLATE.md
# 0.69.0-rc.4 -> 0690rc4
RN_SHORT_VERSION=${RELEASE_VERSION//[.-]/}

PRERELEASE=false
if [[ "$RELEASE_VERSION" == *"rc"* ]]; then
  PRERELEASE=true
fi

RELEASE_TEMPLATE_PATH="$REACT_NATIVE_PATH/.github/RELEASE_TEMPLATE.md"
if [[ -f $RELEASE_TEMPLATE_PATH ]]; then
  # Replace placeholders in template with actual RN version strings
  RELEASE_BODY=$(sed -e "s/__VERSION__/$RELEASE_VERSION/g" -e "s/__SHORT_VERSION__/$RN_SHORT_VERSION/g" "$RELEASE_TEMPLATE_PATH")
else
  describe "Could not load GitHub Release template. Falling back to placeholder text."
  RELEASE_BODY="<!-- TODO: Fill this out using RELEASE_TEMPLATE.md -->"
fi

# Format and encode JSON payload
RELEASE_DATA=$(jo tag_name="$GIT_TAG" name="$RELEASE_VERSION" body="$RELEASE_BODY" draft=true prerelease="$PRERELEASE" generate_release_notes=false)
if [[ ! $RELEASE_DATA ]]; then
  echoerr "Could not format release data."
  exit 1
fi

# Create GitHub Release draft
describe_header "Creating GitHub release."
describe "Release payload: $RELEASE_DATA"

if [[ $RELEASE_TYPE == "release" ]]; then
  CREATE_RELEASE_RESPONSE=$(curl -X POST \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Authorization: Bearer $GITHUB_TOKEN" \
      -d "$RELEASE_DATA" \
      "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases"
  )
  STATUS=$?
  if [ $STATUS == 0 ]; then
    describe "Created GitHub Release successfully."
    RELEASE_ID=$(echo "$CREATE_RELEASE_RESPONSE" | jq '.id')
  else
    echoerr "Could not create GitHub release, request failed with $STATUS:\n\n$CREATE_RELEASE_RESPONSE"
    exit 1
  fi
elif [[ $RELEASE_TYPE == "dry-run" ]]; then
  describe "Skipping creating GitHub release because dry-run."
fi

# Upload artifacts
describe_header "Uploading artifacts to GitHub release."
for ARTIFACT_PATH in "${ARTIFACTS[@]}"
do
    :
    # Upload Hermes artifacts to GitHub Release
    ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
    describe "Uploading $ARTIFACT_NAME..."

    if [[ $RELEASE_TYPE == "release" ]]; then
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
    elif [[ $RELEASE_TYPE == "dry-run" ]]; then
      describe "Skipping $ARTIFACT_NAME upload because dry-run."
    fi
done
