#!/usr/bin/env bash

# Copyright (c) 2015-present, Facebook, Inc.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

THIS_DIR=$(dirname "$0")
source "${THIS_DIR}/.packager.env"
cd "$THIS_DIR/.."
node "./local-cli/cli.js" start "$@"
