#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x -e

release_version="$1"; shift
hermesc_path="$1"; shift
jsi_path="$1"; shift

# Based on platform name returns the framework copy destination. Used later by `vendored_frameworks` in Podspec.
# Fallbacks to "ios" if platform is not recognized.
function get_platform_copy_destination {
    if [[ $1 == "macosx" ]]; then
      echo "macosx"
      return
    elif [[ $1 == "xros" || $1 == "xrsimulator" ]]; then
      echo "xros"
      return
    fi

    echo "ios"
}

function get_deployment_target {
    if [[ $1 == "macosx" ]]; then
      echo "${MACOSX_DEPLOYMENT_TARGET}"
      return
    elif [[ $1 == "xrsimulator" || $1 == "xros" ]]; then
      echo "${XROS_DEPLOYMENT_TARGET}"
      return
    fi

    echo "${IPHONEOS_DEPLOYMENT_TARGET}"
}

enable_debugger="false"
if [[ "$CONFIGURATION" == "Debug" ]]; then
  enable_debugger="true"
fi

cmake_build_type=""
if [[ $CONFIGURATION == "Debug" ]]; then
  # JS developers aren't VM developers.
  # Therefore we're passing as build type Release, to provide a faster build.
  cmake_build_type="Release"
else
  cmake_build_type="MinSizeRel"
fi

deployment_target=$(get_deployment_target $PLATFORM_NAME)

xcode_15_flags=""
xcode_major_version=$(xcodebuild -version | grep -oE '[0-9]*' | head -n 1)
if [[ $xcode_major_version -ge 15 ]]; then
  echo "########### Using LINKER:-ld_classic ###########"
  xcode_15_flags="LINKER:-ld_classic"
fi

architectures=$( echo "$ARCHS" | tr  " " ";" )

echo "Configure Apple framework"

"$CMAKE_BINARY" \
  -S "${PODS_ROOT}/hermes-engine" \
  -B "${PODS_ROOT}/hermes-engine/build/${PLATFORM_NAME}" \
  -DHERMES_EXTRA_LINKER_FLAGS="$xcode_15_flags" \
  -DHERMES_APPLE_TARGET_PLATFORM:STRING="$PLATFORM_NAME" \
  -DCMAKE_OSX_ARCHITECTURES:STRING="$architectures" \
  -DCMAKE_OSX_DEPLOYMENT_TARGET:STRING="$deployment_target" \
  -DHERMES_ENABLE_DEBUGGER:BOOLEAN="$enable_debugger" \
  -DHERMES_ENABLE_INTL:BOOLEAN=true \
  -DHERMES_ENABLE_LIBFUZZER:BOOLEAN=false \
  -DHERMES_ENABLE_FUZZILLI:BOOLEAN=false \
  -DHERMES_ENABLE_TEST_SUITE:BOOLEAN=false \
  -DHERMES_ENABLE_BITCODE:BOOLEAN=false \
  -DHERMES_BUILD_APPLE_FRAMEWORK:BOOLEAN=true \
  -DHERMES_BUILD_SHARED_JSI:BOOLEAN=false \
  -DHERMES_BUILD_APPLE_DSYM:BOOLEAN=true \
  -DIMPORT_HERMESC:PATH="${hermesc_path}" \
  -DJSI_DIR="$jsi_path" \
  -DHERMES_RELEASE_VERSION="for RN $release_version" \
  -DCMAKE_BUILD_TYPE="$cmake_build_type"

echo "Build Apple framework"

"$CMAKE_BINARY" \
  --build "${PODS_ROOT}/hermes-engine/build/${PLATFORM_NAME}" \
  --target libhermes \
  -j "$(sysctl -n hw.ncpu)"

echo "Copy Apple framework to destroot/Library/Frameworks"

platform_copy_destination=$(get_platform_copy_destination $PLATFORM_NAME)

cp -pfR \
  "${PODS_ROOT}/hermes-engine/build/${PLATFORM_NAME}/API/hermes/hermes.framework" \
  "${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/${platform_copy_destination}"
