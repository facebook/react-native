#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x

release_version="$1"; shift
hermesc_path="$1"; shift

build_cli_tools="false"
if [[ "$PLATFORM_NAME" == macosx ]]; then
  build_cli_tools="true"
fi

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

deployment_target=${IPHONEOS_DEPLOYMENT_TARGET}
if [ -z "$deployment_target" ]; then
  deployment_target=${MACOSX_DEPLOYMENT_TARGET}
fi

architectures=$( echo "$ARCHS" | tr  " " ";" )

echo "Configure Apple framework"

"$CMAKE_BINARY" \
  -S "${PODS_ROOT}/hermes-engine" \
  -B "${PODS_ROOT}/hermes-engine/build/${PLATFORM_NAME}" \
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
  -DHERMES_BUILD_APPLE_DSYM:BOOLEAN=true \
  -DHERMES_ENABLE_TOOLS:BOOLEAN="$build_cli_tools" \
  -DIMPORT_HERMESC:PATH="${hermesc_path}" \
  -DHERMES_RELEASE_VERSION="for RN $release_version" \
  -DCMAKE_INSTALL_PREFIX:PATH="${PODS_ROOT}/hermes-engine/destroot" \
  -DCMAKE_BUILD_TYPE="$cmake_build_type"

echo "Build Apple framework"

"$CMAKE_BINARY" \
  --build "${PODS_ROOT}/hermes-engine/build/${PLATFORM_NAME}" \
  --target "install/strip" \
  -j "$(sysctl -n hw.ncpu)"

echo "Copy Apple framework to destroot/Library/Frameworks"

cp -pfR \
  "${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/${PLATFORM_NAME}/hermes.framework" \
  "${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/ios"
rm -rf "${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/${PLATFORM_NAME}"
