#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

GITHUB_OWNER=${CIRCLE_PROJECT_USERNAME:-facebook} \
GITHUB_REPO=${CIRCLE_PROJECT_REPONAME:-react-native} \
GITHUB_PR_NUMBER="${CIRCLE_PR_NUMBER:-${CIRCLE_PULL_REQUEST##*/}}" \
GITHUB_REF=${CIRCLE_BRANCH} \
GITHUB_SHA=${CIRCLE_SHA1} \
exec node packages/react-native-bots/post-artifacts-link.js
