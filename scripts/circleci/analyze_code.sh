#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cat <(echo eslint; npm run lint --silent -- --format=json; echo flow; npm run flow --silent -- check --json) | node scripts/circleci/code-analysis-bot.js

# check status
STATUS=$?
if [ $STATUS == 0 ]; then
  echo "Code analyzed successfully."
else
  echo "Code analysis failed, error status $STATUS."
fi
