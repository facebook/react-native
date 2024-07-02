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

PLATFORMS=("macosx" "iphoneos" "iphonesimulator" "catalyst" "xros" "xrsimulator")

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

function get_visionos_deployment_target {
  use_env_var_or_ruby_prop "${XROS_DEPLOYMENT_TARGET}" "deployment_target('visionos')"
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
  local enable_debugger cmake_build_type xcode_15_flags xcode_major_version

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

  xcode_15_flags=""
  xcode_major_version=$(xcodebuild -version | grep -oE '[0-9]*' | head -n 1)
  if [[ $xcode_major_version -ge 15 ]]; then
    xcode_15_flags="LINKER:-ld_classic"
  fi

  pushd "$HERMES_PATH" > /dev/null || exit 1
    cmake -S . -B "build_$1" \
      -DHERMES_EXTRA_LINKER_FLAGS="$xcode_15_flags" \
      -DHERMES_APPLE_TARGET_PLATFORM:STRING="$1" \
      -DCMAKE_OSX_ARCHITECTURES:STRING="$2" \
      -DCMAKE_OSX_DEPLOYMENT_TARGET:STRING="$3" \
      -DHERMES_ENABLE_DEBUGGER:BOOLEAN="$enable_debugger" \
      -DHERMES_ENABLE_INTL:BOOLEAN=true \
      -DHERMES_ENABLE_LIBFUZZER:BOOLEAN=false \
      -DHERMES_ENABLE_FUZZILLI:BOOLEAN=false \
      -DHERMES_ENABLE_TEST_SUITE:BOOLEAN=false \
      -DHERMES_ENABLE_BITCODE:BOOLEAN=false \
      -DHERMES_BUILD_APPLE_FRAMEWORK:BOOLEAN=true \
      -DHERMES_BUILD_SHARED_JSI:BOOLEAN=false \
      -DHERMES_BUILD_APPLE_DSYM:BOOLEAN=true \
      -DIMPORT_HERMESC:PATH="$IMPORT_HERMESC_PATH" \
      -DJSI_DIR="$JSI_PATH" \
      -DHERMES_RELEASE_VERSION="for RN $(get_release_version)" \
      -DCMAKE_BUILD_TYPE="$cmake_build_type"
    popd > /dev/null || exit 1
}

function build_host_hermesc_if_needed {
  if [[ ! -f "$IMPORT_HERMESC_PATH" ]]; then
    build_host_hermesc
  else
    echo "[HermesC] Skipping! Found an existent hermesc already at: $IMPORT_HERMESC_PATH"
  fi
}

# Utility function to build an Apple framework
function build_apple_framework {
  # Only build host HermesC if no file found at $IMPORT_HERMESC_PATH
  build_host_hermesc_if_needed

  # Confirm ImportHermesc.cmake is now available.
  [ ! -f "$IMPORT_HERMESC_PATH" ] &&
  echo "Host hermesc is required to build apple frameworks!"

  # $1: platform, $2: architectures, $3: deployment target
  echo "Building $BUILD_TYPE framework for $1 with architectures: $2"
  configure_apple_framework "$1" "$2" "$3"

  pushd "$HERMES_PATH" > /dev/null || exit 1
    mkdir -p "destroot/Library/Frameworks/$1"
    cmake --build "./build_$1" --target libhermes -j "${NUM_CORES}"
    cp -R "./build_$1"/API/hermes/hermes.framework* "destroot/Library/Frameworks/$1"

    # In a MacOS build, also produce the hermes and hermesc CLI tools.
    if [[ $1 == macosx ]]; then
      cmake --build "./build_$1" --target hermesc hermes -j "${NUM_CORES}"
      mkdir -p destroot/bin
      cp "./build_$1/bin"/* "destroot/bin"
    fi

    # Copy over Hermes and JSI API headers.
    mkdir -p destroot/include/hermes/Public
    cp public/hermes/Public/*.h destroot/include/hermes/Public

    mkdir -p destroot/include/hermes
    cp API/hermes/*.h destroot/include/hermes

    mkdir -p destroot/include/hermes/inspector
    cp API/hermes/inspector/*.h destroot/include/hermes/inspector

    mkdir -p destroot/include/hermes/inspector/chrome
    cp API/hermes/inspector/chrome/*.h destroot/include/hermes/inspector/chrome

    mkdir -p destroot/include/jsi
    cp "$JSI_PATH"/jsi/*.h destroot/include/jsi
  popd > /dev/null || exit 1
}

function prepare_dest_root_for_ci {
  mkdir -p  "destroot/bin"
  for platform in "${PLATFORMS[@]}"; do
    mkdir -p "destroot/Library/Frameworks/$platform"
    cp -R "./build_$platform/API/hermes/hermes.framework"* "destroot/Library/Frameworks/$platform"
  done

  cp "./build_macosx/bin/"* "destroot/bin"

  # Copy over Hermes and JSI API headers.
  mkdir -p destroot/include/hermes/Public
  cp public/hermes/Public/*.h destroot/include/hermes/Public

  mkdir -p destroot/include/hermes
  cp API/hermes/*.h destroot/include/hermes

  mkdir -p destroot/include/hermes/inspector
  cp API/hermes/inspector/*.h destroot/include/hermes/inspector

  mkdir -p destroot/include/hermes/inspector/chrome
  cp API/hermes/inspector/chrome/*.h destroot/include/hermes/inspector/chrome

  mkdir -p destroot/include/jsi
  cp "$JSI_PATH"/jsi/*.h destroot/include/jsi
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
