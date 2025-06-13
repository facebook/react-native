/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <glog/logging.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDynamicProvider.h>
#include <yoga/YGEnums.h>
#include <yoga/YGValue.h>
#include <format>
#include <iostream>
#include <memory>

using namespace facebook::react;

static void setUpLogging() {
  google::InitGoogleLogging("react-native-fantom");
  FLAGS_logtostderr = true;
}

static void setUpFeatureFlags() {
  folly::dynamic dynamicFeatureFlags = folly::dynamic::object();

  dynamicFeatureFlags["enableBridgelessArchitecture"] = true;
  dynamicFeatureFlags["cxxNativeAnimatedEnabled"] = true;

  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsDynamicProvider>(
          dynamicFeatureFlags));
}

int main() {
  setUpLogging();

  setUpFeatureFlags();

  LOG(INFO) << "Hello, I am fantom_tester using glog!";
  LOG(INFO) << std::format(
      "[Yoga] undefined == zero: {}", YGValueZero == YGValueUndefined);

  return 0;
}
