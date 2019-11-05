#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

THIS_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$THIS_DIR/setup.sh"

buck test fbsource//xplat/hermes-inspector:chrome &&
  buck test fbsource//xplat/hermes-inspector:detail &&
  buck test fbsource//xplat/hermes-inspector:inspectorlib &&
  buck build fbsource//xplat/hermes-inspector:hermes-chrome-debug-server
