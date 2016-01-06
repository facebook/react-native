#!/bin/bash
# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree. An additional grant
# of patent rights can be found in the PATENTS file in the same directory.

# Bundle React Native app's code and image assets.
# This script is supposed to be invoked as part of Xcode build process
# and relies on envoronment variables (including PWD) set by Xcode

case "$CONFIGURATION" in
  Debug)
    DEV=true
    ;;
  "")
    echo "$0 must be invoked by Xcode"
    exit 1
    ;;
  *)
    DEV=false
    ;;
esac

search_parent_paths_for() {
  if [ -e "$1" ]; then
    pwd
    return 0
  elif [ "$PWD" != "/" ]; then
    (cd ..; search_parent_paths_for "$1")
    return $?
  fi
  return 1
}

# Load user environment (which should also handle ndenv or nvm setup)
[ -e "$HOME/.bashrc" ] && source "$HOME/.bashrc"

# Add node binstubs to our binary search $PATH
project_root_path="$(search_parent_paths_for node_modules)"
export PATH="$PATH:$project_root_path/node_modules/.bin"

# npm global install path may be a non-standard location
PATH="$(npm prefix -g)/bin:$PATH"

# Define NVM_DIR and source the nvm.sh setup script
[ -z "$NVM_DIR" ] && export NVM_DIR="$HOME/.nvm"

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  . "$HOME/.nvm/nvm.sh"
elif [[ -x "$(command -v brew)" && -s "$(brew --prefix nvm)/nvm.sh" ]]; then
  . "$(brew --prefix nvm)/nvm.sh"
fi

# Set up the nodenv node version manager if present
if [[ -x "$HOME/.nodenv/bin/nodenv" ]]; then
  eval "$($HOME/.nodenv/bin/nodenv init -)"
fi

# Xcode project file for React Native apps is located in ios/ subfolder
cd ..

set -x
DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH

react-native bundle \
  --entry-file index.ios.js \
  --platform ios \
  --dev $DEV \
  --bundle-output "$DEST/main.jsbundle" \
  --assets-dest "$DEST"
