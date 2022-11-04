#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script creates a draft GitHub Release using RELEASE_TEMPLATE.md
# as a template and will upload the provided artifacts to the release.
#
# Install dependencies:
# apt update && apt install -y jq jo

if [ $# -eq 0 ]; then
    echo "Usage: create_github_release.sh <release_type> <git_tag> <release_version> <github_token> [artifact ...]"
    echo ""
    echo "<release_type> is one of release, dry-run, nightly"
    exit 1
fi

THIS_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REACT_NATIVE_PATH="$THIS_DIR/../.."

GITHUB_OWNER=${CIRCLE_PROJECT_USERNAME:-facebook}
GITHUB_REPO=${CIRCLE_PROJECT_REPONAME:-react-native}

RELEASE_TYPE="$1"; shift
GIT_TAG="$1"; shift
RELEASE_VERSION="$1"; shift
GITHUB_TOKEN="$1"; shift
ARTIFACTS=("$@")

GITHUB_API_HEADER_AUTHORIZATION="Authorization: Bearer $GITHUB_TOKEN"
GITHUB_API_HEADER_ACCEPT="Accept: application/vnd.github.v3+json"
GITHUB_API_RELEASES_ENDPOINT="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases"
GITHUB_API_RELEASES_UPLOAD_ENDPOINT="https://uploads.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases"

RELEASE_TEMPLATE_PATH="$REACT_NATIVE_PATH/.github/RELEASE_TEMPLATE.md"

describe_header () {
  printf "\\n>>>>> %s\\n" "$1"
}

describe () {
  printf "\\n%s\\n" "$1"
}

echoerr () {
  echo "$@" 1>&2
}

create_release_body () {
  # Parse arguments:
  local release_version
  release_version="$1"; shift

  local short_version release_body
  # Derive short version string for use in the sample command used
  # to create a new RN app in RELEASE_TEMPLATE.md
  # 0.69.0-rc.4 -> 0690rc4
  short_version=${release_version//[.-]/}

  if [[ -f $RELEASE_TEMPLATE_PATH ]]; then
    # Replace placeholders in template with actual RN version strings
    release_body="$(sed -e "s/__VERSION__/$release_version/g" -e "s/__SHORT_VERSION__/$short_version/g" "$RELEASE_TEMPLATE_PATH")"
  else
    # Handle missing template gracefully. Instead of blocking a release,
    # use a placeholder text with a reminder to add back a template.
    release_body="<!-- TODO: Fill this out! Tip: You can pre-populate this text next time by creating a template at $RELEASE_TEMPLATE_PATH -->"
  fi

  echo "$release_body"
  return 0
}

create_release_data () {
  # Parse arguments:
  local git_tag release_version
  git_tag="$1"; shift
  release_version="$1"; shift

  local prerelease release_body release_data jo_status

  # Mark release candidates as a prelease
  prerelease=false
  if [[ "$release_version" == *"rc"* ]]; then
    prerelease=true
  fi

  release_body=$(create_release_body "$release_version")

  # Format and encode JSON payload
  release_data=$(jo tag_name="$git_tag" name="$release_version" body="$release_body" draft=true prerelease="$prerelease" generate_release_notes=false)
  jo_status=$?

  if [[ $jo_status == 0 ]]; then
    echo "$release_data"
    return 0
  else
    echo "Could not format release data."
    return 1
  fi
}

create_github_release_with_data () {
  # Parse arguments:
  local release_data
  release_data="$1"; shift

  local http_response_code http_response temp_dir
  temp_dir=$(mktemp -d)

  # Redirect curl response to temporary file and http response code to stdout
  # shellcheck disable=SC2086
  http_response_code=$(curl -s -o $temp_dir/create_github_release_response.json -w "%{http_code}" \
      -X POST \
      -H "$GITHUB_API_HEADER_ACCEPT" \
      -H "$GITHUB_API_HEADER_AUTHORIZATION" \
      -d "$release_data" \
      "$GITHUB_API_RELEASES_ENDPOINT"
  )
  echo "http_response_code = $http_response_code"
  # shellcheck disable=SC2086
  http_response=$(cat $temp_dir/create_github_release_response.json)
  if [ "$http_response_code" != "200" ]; then
    echo "$http_response" | jq '.message'
    return 1
  else
    echo "$http_response" | jq '.id'
    return 0
  fi
}

upload_artifact_for_github_release () {
  # Parse arguments:
  local release_id artifact_name artifact_path
  release_id="$1"; shift
  artifact_name="$1"; shift
  artifact_path="$1"; shift

  local http_response_code http_response temp_dir content_length
  temp_dir=$(mktemp -d)

  content_length=$(wc -c "$artifact_path" | awk '{print $1}')
  # Redirect curl response to temporary file and http response code to stdout
  # shellcheck disable=SC2086
  http_response_code=$(curl -s -o $temp_dir/upload_artifact_for_github_release_response.json -w "%{http_code}" \
    -X POST \
    -H "$GITHUB_API_HEADER_ACCEPT" \
    -H "$GITHUB_API_HEADER_AUTHORIZATION" \
    -H "Content-Length: $content_length" \
    -H "Content-Type: application/gzip" \
    -T "$artifact_path" \
    "$GITHUB_API_RELEASES_UPLOAD_ENDPOINT/$release_id/assets?name=$artifact_name")

  # shellcheck disable=SC2086
  http_response=$(cat "$temp_dir/upload_artifact_for_github_release_response.json")
  if [ "$http_response_code" != "200" ]; then
    echo "$http_response" | jq '.message'
    return 1
  else
    return 0
  fi
}

if [ -z "$GIT_TAG" ]; then
  echoerr "GIT_TAG is required."
  exit 1
fi

if [ -z "$RELEASE_VERSION" ]; then
  echoerr "RELEASE_VERSION is required."
  exit 1
fi

if [[ $RELEASE_TYPE == "release" ]]; then
  if [ -z "$GITHUB_TOKEN" ]; then
    echoerr "GITHUB_TOKEN is required."
    exit 1
  fi

  # Verify if artifacts exist, so we may exit early and avoid
  # creating a release if the supplied artifacts cannot be found
  if [ ${#ARTIFACTS[@]} != 0 ]; then
    for ARTIFACT_PATH in "${ARTIFACTS[@]}"
    do
        :
        if [[ ! -f "$ARTIFACT_PATH" ]]; then
          echoerr "Could not locate artifact: $ARTIFACT_PATH"
          exit 1
        fi
    done
  fi

  describe_header "Preparing to create a GitHub release."
elif [[ $RELEASE_TYPE == "dry-run" ]]; then
  describe_header "Preparing to create a GitHub release as a dry-run."
elif [[ $RELEASE_TYPE == "nightly" ]]; then
  echo "GitHub Releases are not used with nightlies. Skipping."
  exit 0
else
  echoerr "Unrecognized release type: $RELEASE_TYPE"
  exit 1
fi

# Create GitHub Release draft
describe_header "Creating GitHub release."

RELEASE_DATA=$(create_release_data "$GIT_TAG" "$RELEASE_VERSION")
RELEASE_DATA_STATUS=$?
if [[ $RELEASE_DATA_STATUS != 0 ]]; then
  echoerr "Could not format release data."
  exit 1
fi

if [[ $RELEASE_TYPE == "release" ]]; then
  CREATE_RELEASE_RESPONSE=$(create_github_release_with_data "$RELEASE_DATA")
  CREATE_RELEASE_STATUS=$?

  if [ $CREATE_RELEASE_STATUS == 0 ]; then
    describe "Created GitHub Release successfully."
    RELEASE_ID="$CREATE_RELEASE_RESPONSE"
  else
    echoerr "Could not create GitHub release, request failed: $CREATE_RELEASE_RESPONSE"
    exit 1
  fi
elif [[ $RELEASE_TYPE == "dry-run" ]]; then
  describe "Skipping creating GitHub release because dry-run."
fi

if [ ${#ARTIFACTS[@]} != 0 ]; then
  # Upload artifacts
  describe_header "Uploading artifacts to GitHub release."
  for ARTIFACT_PATH in "${ARTIFACTS[@]}"
  do
      :
      # Upload Hermes artifacts to GitHub Release
      ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
      describe "Uploading $ARTIFACT_NAME..."

      if [[ $RELEASE_TYPE == "release" ]]; then
        UPLOAD_RELEASE_ARTIFACT_RESPONSE=$(upload_artifact_for_github_release "$RELEASE_ID" "$ARTIFACT_NAME" "$ARTIFACT_PATH")
        UPLOAD_RELEASE_ARTIFACT_STATUS=$?

        if [ $UPLOAD_RELEASE_ARTIFACT_STATUS == 0 ]; then
          describe "Uploaded $ARTIFACT_NAME."
        else
          echoerr "Could not upload $ARTIFACT_NAME to GitHub release: $UPLOAD_RELEASE_ARTIFACT_RESPONSE"
          exit 1
        fi
      elif [[ $RELEASE_TYPE == "dry-run" ]]; then
        describe "Skipping $ARTIFACT_NAME upload because dry-run."
      fi
  done
fi

describe "Done."
