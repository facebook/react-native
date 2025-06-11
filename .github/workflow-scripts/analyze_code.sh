#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

export GITHUB_OWNER=-facebook
export GITHUB_REPO=-react-native

{
  echo eslint
  npm run lint --silent -- --format=json

  echo flow
  npm run flow-check --silent --json

  echo google-java-format
  node scripts/lint-java.js --diff
} | node private/react-native-bots/code-analysis-bot.js

STATUS=$?
if [ $STATUS == 0 ]; then
  echo "Code analyzed successfully."
else
  echo "Code analysis failed, error status $STATUS."
fi
exit $STATUS
