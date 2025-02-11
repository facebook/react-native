#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

bundle install
bundle exec pod install

xcodebuild \
        -scheme "RNTester" \
        -workspace RNTesterPods.xcworkspace \
        -configuration "Release" \
        -sdk "iphonesimulator" \
        -destination "generic/platform=iOS Simulator" \
        -derivedDataPath "/tmp/RNTesterBuild"
xcrun simctl boot "iPhone 15 Pro"
xcrun simctl install booted "/tmp/RNTesterBuild/Build/Products/Release-iphonesimulator/RNTester.app"
open -a simulator
