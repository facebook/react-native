#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Add your own Personal Access Token here.
# Create it at https://github.com/settings/tokens
GITHUB_TOKEN=""

# Setup Circle CI envvars
CIRCLE_TAG=""
CIRCLE_PROJECT_USERNAME=""
CIRCLE_PROJECT_REPONAME=""

if [ -z "$GITHUB_TOKEN" ]
then
      echo "\$GITHUB_TOKEN is empty"
      exit 1
fi
if [ -z "$CIRCLE_TAG" ]
then
      echo "\$CIRCLE_TAG is empty"
      exit 1
fi
if [ -z "$CIRCLE_PROJECT_USERNAME" ]
then
      echo "\$CIRCLE_PROJECT_USERNAME is empty"
      exit 1
fi
if [ -z "$CIRCLE_PROJECT_REPONAME" ]
then
      echo "\$CIRCLE_PROJECT_REPONAME is empty"
      exit 1
fi

# Dummy artifacts to upload
ARTIFACTS=("hermes-runtime-darwin-$CIRCLE_TAG.tar.gz")
for ARTIFACT_PATH in "${ARTIFACTS[@]}"
do
    :
    head -c 1024 </dev/urandom >"$ARTIFACT_PATH"
done

../circleci/create_github_release.sh "$CIRCLE_TAG" "$CIRCLE_PROJECT_USERNAME" "$CIRCLE_PROJECT_REPONAME" "$GITHUB_TOKEN" "${ARTIFACTS[@]}"
