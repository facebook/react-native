#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Defines functions for building various Hermes frameworks.
# See build-ios-framework.sh and build-mac-framework.sh for usage examples.

CURR_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

IMPORT_HERMESC_PATH=${HERMES_OVERRIDE_HERMESC_PATH:-$PWD/build_host_hermesc/ImportHermesc.cmake}
BUILD_TYPE=${BUILD_TYPE:-Debug}

HERMES_PATH="$CURR_SCRIPT_DIR/.."
REACT_NATIVE_PATH=${REACT_NATIVE_PATH:-$CURR_SCRIPT_DIR/../../..}

NUM_CORES=$(sysctl -n hw.ncpu)

if [[ -z "$JSI_PATH" ]]; then
  JSI_PATH="$REACT_NATIVE_PATH/ReactCommon/jsi"
fi

function use_env_var_or_ruby_prop {
  if [[ -n "$1" ]]; then
    echo "$1"
  else
    ruby -rcocoapods-core -rjson -e "puts Pod::Specification.from_file('hermes-engine.podspec').$2"
  fi
}

function get_release_version {
  use_env_var_or_ruby_prop "${RELEASE_VERSION}" "version"
}

function get_ios_deployment_target {
  use_env_var_or_ruby_prop "${IOS_DEPLOYMENT_TARGET}" "deployment_target('ios')"
}

function get_mac_deployment_target {
  use_env_var_or_ruby_prop "${MAC_DEPLOYMENT_TARGET}" "deployment_target('osx')"
}

# Build host hermes compiler for internal bytecode
function build_host_hermesc {
  echo "Building hermesc"
  pushd "$HERMES_PATH" > /dev/null || exit 1
    cmake -S . -B build_host_hermesc -DJSI_DIR="$JSI_PATH"
    cmake --build ./build_host_hermesc --target hermesc -j "${NUM_CORES}"
  popd > /dev/null || exit 1
}

# Utility function to configure an Apple framework
function configure_apple_framework {
  local build_cli_tools enable_bitcode enable_debugger cmake_build_type

  if [[ $1 == iphoneos || $1 == catalyst ]]; then
    enable_bitcode="true"
  else
    enable_bitcode="false"
  fi
  if [[ $1 == macosx ]]; then
    build_cli_tools="true"
  else
    build_cli_tools="false"
  fi
  if [[ $BUILD_TYPE == "Debug" ]]; then
    enable_debugger="true"
  else
    enable_debugger="false"
  fi
  if [[ $BUILD_TYPE == "Debug" ]]; then
    # JS developers aren't VM developers.
    # Therefore we're passing as build type Release, to provide a faster build.
    cmake_build_type="Release"
  else
    cmake_build_type="MinSizeRel"
  fi

  pushd "$HERMES_PATH" > /dev/null || exit 1
    cmake -S . -B "build_$1" \
      -DHERMES_APPLE_TARGET_PLATFORM:STRING="$1" \
      -DCMAKE_OSX_ARCHITECTURES:STRING="$2" \
      -DCMAKE_OSX_DEPLOYMENT_TARGET:STRING="$3" \
      -DHERMES_ENABLE_DEBUGGER:BOOLEAN="$enable_debugger" \
      -DHERMES_ENABLE_INTL:BOOLEAN=true \
      -DHERMES_ENABLE_LIBFUZZER:BOOLEAN=false \
      -DHERMES_ENABLE_FUZZILLI:BOOLEAN=false \
      -DHERMES_ENABLE_TEST_SUITE:BOOLEAN=false \
      -DHERMES_ENABLE_BITCODE:BOOLEAN="$enable_bitcode" \
      -DHERMES_BUILD_APPLE_FRAMEWORK:BOOLEAN=true \
      -DHERMES_BUILD_APPLE_DSYM:BOOLEAN=true \
      -DHERMES_ENABLE_TOOLS:BOOLEAN="$build_cli_tools" \
      -DIMPORT_HERMESC:PATH="$IMPORT_HERMESC_PATH" \
      -DJSI_DIR="$JSI_PATH" \
      -DHERMES_RELEASE_VERSION="for RN $(get_release_version)" \
      -DCMAKE_INSTALL_PREFIX:PATH=../destroot \
      -DCMAKE_BUILD_TYPE="$cmake_build_type"
    popd > /dev/null || exit 1
}

# Utility function to build an Apple framework
function build_apple_framework {
  # Only build host HermesC if no file found at $IMPORT_HERMESC_PATH
  [ ! -f "$IMPORT_HERMESC_PATH" ] &&
  build_host_hermesc

  # Confirm ImportHermesc.cmake is now available.
  [ ! -f "$IMPORT_HERMESC_PATH" ] &&
  echo "Host hermesc is required to build apple frameworks!"

  echo "Building $BUILD_TYPE framework for $1 with architectures: $2"
  configure_apple_framework "$1" "$2" "$3"

  pushd "$HERMES_PATH" > /dev/null || exit 1
    cmake --build "./build_$1" --target install/strip -j "${NUM_CORES}"
  popd > /dev/null || exit 1
}

# Accepts an array of frameworks and will place all of
# the architectures into an universal folder and then remove
# the merged frameworks from destroot
function create_universal_framework {
  pushd "$HERMES_PATH/destroot/Library/Frameworks" > /dev/null || exit 1

  local platforms=("$@")
  local args=""

  echo "Creating universal framework for platforms: ${platforms[*]}"

  for i in "${!platforms[@]}"; do
    local platform="${platforms[$i]}"
    local hermes_framework_path="${platform}/hermes.framework"
    local dSYM_path="$hermes_framework_path"
    local dSYM_base_path="$HERMES_PATH/destroot/Library/Frameworks"

    # If the dSYM rename has failed, the dSYM are generated as 0.dSYM
    # (Apple default name) rather then hermes.framework.dSYM.
    if [[ -e "$dSYM_base_path/${platform}/0.dSYM" ]]; then
      dSYM_path="${platform}/0"
    fi

    args+="-framework $hermes_framework_path "

    # Path to dSYM must be absolute
    args+="-debug-symbols $dSYM_base_path/$dSYM_path.dSYM "
  done

  mkdir -p universal
  # shellcheck disable=SC2086
  if xcodebuild -create-xcframework $args -output "universal/hermes.xcframework"
  then
    # # Remove the thin iOS hermes.frameworks that are now part of the universal
    # XCFramework
    for platform in "${platforms[@]}"; do
      rm -r "$platform"
    done
  fi

  popd > /dev/null || exit 1
}
