/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <glog/logging.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDynamicProvider.h>
#include <memory>
#include "AppSettings.h"
#include "TesterAppDelegate.h"

using namespace facebook::react;

static void setUpLogging() {
  google::InitGoogleLogging("react-native-fantom");
  FLAGS_logtostderr = true;
  FLAGS_minloglevel = AppSettings::minLogLevel;
}

static void setUpFeatureFlags() {
  folly::dynamic dynamicFeatureFlags = folly::dynamic::object();

  dynamicFeatureFlags["enableBridgelessArchitecture"] = true;
  dynamicFeatureFlags["cxxNativeAnimatedEnabled"] = true;

  if (AppSettings::dynamicFeatureFlags.has_value()) {
    dynamicFeatureFlags.update(AppSettings::dynamicFeatureFlags.value());
  }

  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsDynamicProvider>(
          dynamicFeatureFlags));
}

int main(int argc, char* argv[]) {
  AppSettings::init(argc, argv);

  setUpLogging();

  setUpFeatureFlags();

  auto appDelegate = TesterAppDelegate(ReactInstanceConfig{
      .appId = "com.meta.reactnative.fantom", .deviceName = "RN Fantom"});

  appDelegate.loadScript(AppSettings::defaultBundlePath, "");

  return 0;
}
