#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

if git ls-files | grep -E '\.npmignore$'; then
  echo "Error: Found unexpected .npmignore file(s). Please use package.json#files instead."
  exit 1
fi
