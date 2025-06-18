/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubQueue.h"

#include <folly/json.h>
#include <gflags/gflags.h>
#include <glog/logging.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDynamicProvider.h>
#include <react/runtime/hermes/HermesInstance.h>
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
using namespace facebook::hermes;
using namespace facebook::jsi;

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

void createHermesInstance() {
  auto queue = std::make_shared<StubQueue>();
  std::unique_ptr<JSRuntime> jsRuntime = HermesInstance::createJSRuntime(
      nullptr,
      queue,
      /* allocInOldGenBeforeTTI */ false);

  facebook::jsi::Runtime& runtime = jsRuntime->getRuntime();
  runtime.evaluateJavaScript(
      std::make_unique<StringBuffer>(
          "var fantom = 'Hello, I am fantom_tester'"),
      "script.js");

  LOG(INFO) << "JS evaluated value: "
            << runtime.global()
                   .getProperty(runtime, "fantom")
                   .getString(runtime)
                   .utf8(runtime);
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

  createHermesInstance();

  return 0;
}
