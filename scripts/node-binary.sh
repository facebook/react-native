#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

[ -z "$NODE_BINARY" ] && export NODE_BINARY="node"

nodejs_not_found()
{
  echo "error: Can't find '$NODE_BINARY' binary to build React Native bundle." >&2
  echo "If you have a non-standard nodejs installation, select your project in Xcode," >&2
  echo "find 'Build Phases' - 'Bundle React Native code and images'" >&2
  echo "and change NODE_BINARY to an absolute path to your node executable." >&2
  echo "You can find it by invoking 'which node' in the terminal." >&2
  exit 2
}

type "$NODE_BINARY" >/dev/null 2>&1 || nodejs_not_found
