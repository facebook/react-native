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

# Path to react-native folder inside node_modules
REACT_NATIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Most projects have their project root, one level up from their Xcode project dir (the "ios" directory)
PROJECT_ROOT=${PROJECT_ROOT:-"$PROJECT_DIR/.."}

cd "$PROJECT_ROOT" || exit

# Define entry file
if [[ "$ENTRY_FILE" ]]; then
  # Use ENTRY_FILE defined by user
  :
elif [[ -s "index.ios.js" ]]; then
  ENTRY_FILE=${1:-index.ios.js}
else
  ENTRY_FILE=${1:-index.js}
fi

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

[ -z "$CLI_PATH" ] && export CLI_PATH="$REACT_NATIVE_DIR/cli.js"

[ -z "$BUNDLE_COMMAND" ] && BUNDLE_COMMAND="bundle"

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

if [ "${IS_MACCATALYST}" = "YES" ]; then
  BUNDLE_PLATFORM="ios"
fi

EMIT_SOURCEMAP=
if [[ ! -z "$SOURCEMAP_FILE" ]]; then
  EMIT_SOURCEMAP=true
fi

PACKAGER_SOURCEMAP_FILE=
if [[ $EMIT_SOURCEMAP == true ]]; then
  if [[ $USE_HERMES != false ]]; then
    PACKAGER_SOURCEMAP_FILE="$CONFIGURATION_BUILD_DIR/$(basename $SOURCEMAP_FILE)"
  else
    PACKAGER_SOURCEMAP_FILE="$SOURCEMAP_FILE"
  fi
  EXTRA_ARGS="$EXTRA_ARGS --sourcemap-output $PACKAGER_SOURCEMAP_FILE"
fi

# Hermes doesn't require JS minification.
if [[ $USE_HERMES != false && $DEV == false ]]; then
  EXTRA_ARGS="$EXTRA_ARGS --minify false"
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

if [[ $USE_HERMES == false ]]; then
  cp "$BUNDLE_FILE" "$DEST/"
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
  "$HERMES_CLI_PATH" -emit-binary -max-diagnostic-width=80 $EXTRA_COMPILER_ARGS -out "$DEST/main.jsbundle" "$BUNDLE_FILE"
  if [[ $EMIT_SOURCEMAP == true ]]; then
    HBC_SOURCEMAP_FILE="$DEST/main.jsbundle.map"
    "$NODE_BINARY" "$COMPOSE_SOURCEMAP_PATH" "$PACKAGER_SOURCEMAP_FILE" "$HBC_SOURCEMAP_FILE" -o "$SOURCEMAP_FILE"
    rm "$HBC_SOURCEMAP_FILE"
    rm "$PACKAGER_SOURCEMAP_FILE"
  fi
  BUNDLE_FILE="$DEST/main.jsbundle"
fi

if [[ $DEV != true && ! -f "$BUNDLE_FILE" ]]; then
  echo "error: File $BUNDLE_FILE does not exist. Your environment is misconfigured as Metro was not able to produce the bundle so your release application won't work!" >&2
  exit 2
fi
