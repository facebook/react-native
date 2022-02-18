#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

GITHUB_OWNER=${CIRCLE_PROJECT_USERNAME:-facebook}
GITHUB_REPO=${CIRCLE_PROJECT_REPONAME:-react-native}
export GITHUB_OWNER
export GITHUB_REPO

if [ -x "$(command -v shellcheck)" ]; then
  IFS=$'\n'

  if [ -n "$CIRCLE_CI" ]; then
    results=( "$(find . -type f -not -path "*node_modules*" -not -path "*third-party*" -name '*.sh' -exec sh -c  'shellcheck "$1" -f json' -- {} \;)" )

    cat <(echo shellcheck; printf '%s\n' "${results[@]}" | jq .,[] | jq -s . | jq --compact-output --raw-output '[ (.[] | .[] | . ) ]') | GITHUB_PR_NUMBER="$CIRCLE_PR_NUMBER" node scripts/circleci/code-analysis-bot.js

    # check status
    STATUS=$?
    if [ $STATUS == 0 ]; then
      echo "Shell scripts analyzed successfully."
    else
      echo "Shell script analysis failed, error status $STATUS."
    fi

  else
    find . \
      -type f \
      -not -path "*node_modules*" \
      -not -path "*third-party*" \
      -name '*.sh' \
    -exec sh -c 'shellcheck "$1"' -- {} \;
  fi

else
  echo 'shellcheck is not installed. See https://github.com/facebook/react-native/wiki/Development-Dependencies#shellcheck for instructions.'
  exit 1
fi

