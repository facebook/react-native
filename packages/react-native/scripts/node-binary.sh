#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# For machines using NVM.
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
. "$HOME/.nvm/nvm.sh"
elif [[ -x "$(command -v brew)" && -s "$(brew --prefix nvm)/nvm.sh" ]]; then
. "$(brew --prefix nvm)/nvm.sh"
fi


[ -z "$NODE_BINARY" ] && export NODE_BINARY="node"

nodejs_not_found()
{
  echo "error: Can't find the '$NODE_BINARY' binary to build the React Native bundle. " \
       "If you have a non-standard Node.js installation, select your project in Xcode, find " \
       "'Build Phases' - 'Bundle React Native code and images' and change NODE_BINARY to an " \
       "absolute path to your node executable. You can find it by invoking 'which node' in the terminal." >&2
  exit 2
}

type "$NODE_BINARY" >/dev/null 2>&1 || nodejs_not_found
