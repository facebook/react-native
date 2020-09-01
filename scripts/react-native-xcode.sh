#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Bundle React Native app's code and image assets.
# This script is supposed to be invoked as part of Xcode build process
# and relies on environment variables (including PWD) set by Xcode

# Print commands before executing them (useful for troubleshooting)
set -x
DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH

# Enables iOS devices to get the IP address of the machine running Metro
if [[ "$CONFIGURATION" = *Debug* && ! "$PLATFORM_NAME" == *simulator ]]; then
  for num in 0 1 2 3 4 5 6 7 8; do
    IP=$(ipconfig getifaddr en${num})
    if [ ! -z "$IP" ]; then
      break
    fi
  done
  if [ -z "$IP" ]; then
    IP=$(ifconfig | grep 'inet ' | grep -v ' 127.' | grep -v ' 169.254.' |cut -d\   -f2  | awk 'NR==1{print $1}')
  fi

  echo "$IP" > "$DEST/ip.txt"
fi

if [[ "$SKIP_BUNDLING" ]]; then
  echo "SKIP_BUNDLING enabled; skipping."
  exit 0;
fi

case "$CONFIGURATION" in
  *Debug*)
    if [[ "$PLATFORM_NAME" == *simulator ]]; then
      if [[ "$FORCE_BUNDLING" ]]; then
        echo "FORCE_BUNDLING enabled; continuing to bundle."
      else
        echo "Skipping bundling in Debug for the Simulator (since the packager bundles for you). Use the FORCE_BUNDLING flag to change this behavior."
        exit 0;
      fi
    else
      echo "Bundling for physical device. Use the SKIP_BUNDLING flag to change this behavior."
    fi

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

# Setting up a project root was a workaround to enable support for non-standard
# structures, including monorepos. Today, CLI supports that out of the box
# and setting custom `PROJECT_ROOT` only makes it confusing. 
#
# As a backwards-compatible change, I am leaving "PROJECT_ROOT" support for those
# who already use it - it is likely a non-breaking removal.
#
# For new users, we default to $PWD - not changing things all.
#
# For context: https://github.com/facebook/react-native/commit/9ccde378b6e6379df61f9d968be6346ca6be7ead#commitcomment-37914902
PROJECT_ROOT=${PROJECT_ROOT:-$PWD}

cd "$PROJECT_ROOT" || exit

# Define NVM_DIR and source the nvm.sh setup script
[ -z "$NVM_DIR" ] && export NVM_DIR="$HOME/.nvm"

# Define entry file
if [[ "$ENTRY_FILE" ]]; then
  # Use ENTRY_FILE defined by user
  :
elif [[ -s "index.ios.js" ]]; then
  ENTRY_FILE=${1:-index.ios.js}
else
  ENTRY_FILE=${1:-index.js}
fi

if [[ $DEV != true && ! -f "$ENTRY_FILE" ]]; then
  echo "error: Entry file $ENTRY_FILE does not exist. If you use another file as your entry point, pass ENTRY_FILE=myindex.js" >&2
  exit 2
fi

if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  . "$HOME/.nvm/nvm.sh"
elif [[ -x "$(command -v brew)" && -s "$(brew --prefix nvm)/nvm.sh" ]]; then
  . "$(brew --prefix nvm)/nvm.sh"
fi

# Set up the nodenv node version manager if present
if [[ -x "$HOME/.nodenv/bin/nodenv" ]]; then
  eval "$("$HOME/.nodenv/bin/nodenv" init -)"
elif [[ -x "$(command -v brew)" && -x "$(brew --prefix nodenv)/bin/nodenv" ]]; then
  eval "$("$(brew --prefix nodenv)/bin/nodenv" init -)"
fi

# Set up the ndenv of anyenv if preset
if [[ ! -x node && -d ${HOME}/.anyenv/bin ]]; then
  export PATH=${HOME}/.anyenv/bin:${PATH}
  if [[ "$(anyenv envs | grep -c ndenv )" -eq 1 ]]; then
    eval "$(anyenv init -)"
  fi
fi

# Path to react-native folder inside node_modules
REACT_NATIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# check and assign NODE_BINARY env
# shellcheck source=/dev/null
source "$REACT_NATIVE_DIR/scripts/node-binary.sh"

[ -z "$NODE_ARGS" ] && export NODE_ARGS=""

[ -z "$CLI_PATH" ] && export CLI_PATH="$REACT_NATIVE_DIR/cli.js"

[ -z "$BUNDLE_COMMAND" ] && BUNDLE_COMMAND="bundle"

[ -z "$HERMES_PATH" ] && HERMES_PATH="$PROJECT_ROOT/node_modules/hermes-engine-darwin/destroot/bin/hermesc"

[ -z "$COMPOSE_SOURCEMAP_PATH" ] && COMPOSE_SOURCEMAP_PATH="$REACT_NATIVE_DIR/scripts/compose-source-maps.js"

if [[ -z "$BUNDLE_CONFIG" ]]; then
  CONFIG_ARG=""
else
  CONFIG_ARG="--config $BUNDLE_CONFIG"
fi

BUNDLE_FILE="$CONFIGURATION_BUILD_DIR/main.jsbundle"

EXTRA_ARGS=

case "$PLATFORM_NAME" in
  "macosx")
    BUNDLE_PLATFORM="macos"
    ;;
  *)
    BUNDLE_PLATFORM="ios"
    ;;
esac

USE_HERMES=
if [[ "$BUNDLE_PLATFORM" == "macos" && -f "$HERMES_PATH" ]]; then
  USE_HERMES=true
fi

EMIT_SOURCEMAP=
if [[ ! -z "$SOURCEMAP_FILE" ]]; then
  EMIT_SOURCEMAP=true
fi

PACKAGER_SOURCEMAP_FILE=
if [[ $EMIT_SOURCEMAP == true ]]; then
  if [[ $USE_HERMES == true ]]; then
    PACKAGER_SOURCEMAP_FILE="$CONFIGURATION_BUILD_DIR/$(basename $SOURCEMAP_FILE)"
  else
    PACKAGER_SOURCEMAP_FILE="$SOURCEMAP_FILE"
  fi
  EXTRA_ARGS="$EXTRA_ARGS --sourcemap-output $PACKAGER_SOURCEMAP_FILE"
fi

"$NODE_BINARY" $NODE_ARGS "$CLI_PATH" $BUNDLE_COMMAND \
  $CONFIG_ARG \
  --entry-file "$ENTRY_FILE" \
  --platform "$BUNDLE_PLATFORM" \
  --dev $DEV \
  --reset-cache \
  --bundle-output "$BUNDLE_FILE" \
  --assets-dest "$DEST" \
  $EXTRA_ARGS \
  $EXTRA_PACKAGER_ARGS

if [[ $USE_HERMES != true ]]; then
  mv "$BUNDLE_FILE" "$DEST/"
  BUNDLE_FILE="$DEST/main.jsbundle"
else
  EXTRA_COMPILER_ARGS=
  if [[ $DEV == true ]]; then
    EXTRA_COMPILER_ARGS=-Og
  else
    EXTRA_COMPILER_ARGS=-O
  fi
  if [[ $EMIT_SOURCEMAP == true ]]; then
    EXTRA_COMPILER_ARGS="$EXTRA_COMPILER_ARGS -output-source-map"
  fi
  HBC_FILE="$CONFIGURATION_BUILD_DIR/$(basename $BUNDLE_FILE)"
  "$HERMES_PATH" -emit-binary $EXTRA_COMPILER_ARGS -out "$HBC_FILE" "$BUNDLE_FILE"
  mv "$HBC_FILE" "$DEST/"
  BUNDLE_FILE="$DEST/main.jsbundle"
  if [[ $EMIT_SOURCEMAP == true ]]; then
    HBC_SOURCEMAP_FILE="$HBC_FILE.map"
    "$NODE_BINARY" "$COMPOSE_SOURCEMAP_PATH" "$PACKAGER_SOURCEMAP_FILE" "$HBC_SOURCEMAP_FILE" -o "$SOURCEMAP_FILE"
  fi
fi

if [[ $DEV != true && ! -f "$BUNDLE_FILE" ]]; then
  echo "error: File $BUNDLE_FILE does not exist. This must be a bug with" >&2
  echo "React Native, please report it here: https://github.com/facebook/react-native/issues"
  exit 2
fi
