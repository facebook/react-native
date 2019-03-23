#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

IFS=$'\n'

results=( "$(find . -type f -not -path "*node_modules*" -not -path "*third-party*" -name '*.sh' -exec sh -c  'shellcheck "$1" -f json' -- {} \;)" )

cat <(echo shellcheck; printf '%s\n' "${results[@]}" | jq .,[] | jq -s . | jq --compact-output --raw-output '[ (.[] | .[] | . ) ]') | node scripts/circleci/code-analysis-bot.js

# check status
STATUS=$?
if [ $STATUS == 0 ]; then
  echo "Shell scripts analyzed successfully."
else
  echo "Shell script analysis failed, error status $STATUS."
fi
