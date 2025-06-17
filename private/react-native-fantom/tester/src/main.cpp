/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/json.h>
#include <gflags/gflags.h>
#include <glog/logging.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDynamicProvider.h>
#include <yoga/YGEnums.h>
#include <yoga/YGValue.h>

#include <format>
#include <iostream>
#include <memory>

DEFINE_string(
    featureFlags,
    "",
    "JSON representation of the common feature flags to set for the app");

using namespace facebook::react;

static void setUpLogging() {
  google::InitGoogleLogging("react-native-fantom");
  FLAGS_logtostderr = true;
}

static folly::dynamic setUpFeatureFlags() {
  folly::dynamic dynamicFeatureFlags = folly::dynamic::object();

  dynamicFeatureFlags["enableBridgelessArchitecture"] = true;
  dynamicFeatureFlags["cxxNativeAnimatedEnabled"] = true;

  if (!FLAGS_featureFlags.empty()) {
    dynamicFeatureFlags.update(folly::parseJson(FLAGS_featureFlags));
  }

  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsDynamicProvider>(
          dynamicFeatureFlags));

  return dynamicFeatureFlags;
}

int main(int argc, char* argv[]) {
  if (argc > 0 && argv != nullptr) {
    // Don't exit app on unknown flags, as some of those may be provided when
    // debugging via XCode:
    gflags::AllowCommandLineReparsing();
    gflags::ParseCommandLineFlags(&argc, &argv, false);
  }

  setUpLogging();

  auto dynamicFeatureFlags = setUpFeatureFlags();

  LOG(INFO) << "Hello, I am fantom_tester using glog!";
  LOG(INFO) << std::format(
      "[Yoga] undefined == zero: {}", YGValueZero == YGValueUndefined);
  LOG(INFO) << fmt::format(
      "[FeatureFlags] overrides: {}", folly::toJson(dynamicFeatureFlags));

  return 0;
}
