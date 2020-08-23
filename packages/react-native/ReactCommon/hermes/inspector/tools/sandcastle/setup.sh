#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

#
# Basic setup for xplat testing in sandcastle. Based on
# xplat/hermes/facebook/sandcastle/setup.sh.

set -x
set -e
set -o pipefail

THIS_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$THIS_DIR" && hg root)

# Buck by default uses clang-3.6 from /opt/local/bin.
# Override it to use system clang.
export PATH="/usr/bin:$PATH"

# Enter xplat
cd "$ROOT_DIR"/xplat || exit 1

# Setup env
export TITLE
TITLE=$(hg log -l 1 --template "{desc|strip|firstline}")
export REV
REV=$(hg log -l 1 --template "{node}")
export AUTHOR
AUTHOR=$(hg log -l 1 --template "{author|emailuser}")

if [ -n "$SANDCASTLE" ]; then
  source automation/setup_buck.sh
fi
