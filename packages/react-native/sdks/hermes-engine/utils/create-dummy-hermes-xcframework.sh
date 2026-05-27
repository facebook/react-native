#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x

# CocoaPods requires vendored frameworks to exist before `pod install` is run,
# and to be proper Moch-O binaries in order to auto-link them to the user's Xcode project.
# This script creates dummy hermesvm.framework for macosx and ios.
# They are then get rewritten by `build-hermes-xcode.sh` during Xcode build.

rm -rf destroot

mkdir -p destroot/Library/Frameworks

pushd destroot/Library/Frameworks > /dev/null || exit 1

echo '' > dummy.c

platforms=( "macosx" "ios" "xros" ) # Add other platforms here if needed

for platform in "${platforms[@]}"
do
    mkdir -p "${platform}/hermesvm.framework"
    clang dummy.c -dynamiclib -o "${platform}/hermesvm.framework/hermesvm"
done

rm dummy.c

popd > /dev/null || exit 1
