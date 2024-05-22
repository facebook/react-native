#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Bundle React Native app's code and image assets.
# This script is supposed to be invoked as part of Xcode build process
# and relies on environment variables (including PWD) set by Xcode

# Print commands before executing them (useful for troubleshooting)
set -x -e
DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH

# Enables iOS devices to get the IP address of the machine running Metro
if [[ ! "$SKIP_BUNDLING_METRO_IP" && "$CONFIGURATION" = *Debug* && ! "$PLATFORM_NAME" == *simulator ]]; then
  for num in 0 1 2 3 4 5 6 7 8; do
    IP=$(ipconfig getifaddr en${num} || echo "")
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

REACT_NATIVE_DIR="$(cd ../../react-native && pwd)"
PROJECT_ROOT=${PROJECT_ROOT:-"$PROJECT_DIR/.."}

cd "$PROJECT_ROOT" || exit

# check and assign NODE_BINARY env
# shellcheck source=/dev/null
source "$REACT_NATIVE_DIR/scripts/node-binary.sh"

HERMES_ENGINE_PATH="$PODS_ROOT/hermes-engine"
[ -z "$HERMES_CLI_PATH" ] && HERMES_CLI_PATH="$HERMES_ENGINE_PATH/destroot/bin/hermesc"

# If hermesc is not available and USE_HERMES is not set to false, show error.
if [[ $USE_HERMES != false && -f "$HERMES_ENGINE_PATH" && ! -f "$HERMES_CLI_PATH" ]]; then
  echo "error: Hermes is enabled but the hermesc binary could not be found at ${HERMES_CLI_PATH}." \
       "Perhaps you need to run 'bundle exec pod install' or otherwise " \
       "point the HERMES_CLI_PATH variable to your custom location." >&2
  exit 2
fi

[ -z "$NODE_ARGS" ] && export NODE_ARGS=""

[ -z "$CLI_PATH" ] && export CLI_PATH="cli.js"

BUNDLE_FILE="$CONFIGURATION_BUILD_DIR/main.jsbundle"

EXTRA_ARGS=()

if [[ $USE_HERMES == false ]]; then
  EXTRA_ARGS+=("--hermes" "false")
elif [[ $DEV == false ]]; then
  # Hermes doesn't require JS minification.
  EXTRA_ARGS+=("--minify" "false")
fi

if [[ $DEV == false ]]; then
  EXTRA_ARGS+=("--debug" "false")
fi

"$NODE_BINARY" $NODE_ARGS "$CLI_PATH" bundle ios \
  "${EXTRA_ARGS[@]}"

if [[ $DEV != true && ! -f "$BUNDLE_FILE" ]]; then
  echo "error: File $BUNDLE_FILE does not exist. Your environment is misconfigured as Metro was not able to produce the bundle so your release application won't work!" >&2
  exit 2
fi
