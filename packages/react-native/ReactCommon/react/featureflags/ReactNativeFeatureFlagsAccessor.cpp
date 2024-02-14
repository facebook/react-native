/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<2154292f89306f25289583537833a065>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <sstream>
#include <stdexcept>
#include <string>
#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

ReactNativeFeatureFlagsAccessor::ReactNativeFeatureFlagsAccessor()
    : currentProvider_(std::make_unique<ReactNativeFeatureFlagsDefaults>()),
      wasOverridden_(false) {}

bool ReactNativeFeatureFlagsAccessor::commonTestFlag() {
  auto flagValue = commonTestFlag_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(0, "commonTestFlag");

    flagValue = currentProvider_->commonTestFlag();
    commonTestFlag_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableBackgroundExecutor() {
  auto flagValue = enableBackgroundExecutor_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(1, "enableBackgroundExecutor");

    flagValue = currentProvider_->enableBackgroundExecutor();
    enableBackgroundExecutor_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::useModernRuntimeScheduler() {
  auto flagValue = useModernRuntimeScheduler_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(2, "useModernRuntimeScheduler");

    flagValue = currentProvider_->useModernRuntimeScheduler();
    useModernRuntimeScheduler_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableMicrotasks() {
  auto flagValue = enableMicrotasks_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(3, "enableMicrotasks");

    flagValue = currentProvider_->enableMicrotasks();
    enableMicrotasks_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::batchRenderingUpdatesInEventLoop() {
  auto flagValue = batchRenderingUpdatesInEventLoop_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(4, "batchRenderingUpdatesInEventLoop");

    flagValue = currentProvider_->batchRenderingUpdatesInEventLoop();
    batchRenderingUpdatesInEventLoop_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableSpannableBuildingUnification() {
  auto flagValue = enableSpannableBuildingUnification_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(5, "enableSpannableBuildingUnification");

    flagValue = currentProvider_->enableSpannableBuildingUnification();
    enableSpannableBuildingUnification_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableCustomDrawOrderFabric() {
  auto flagValue = enableCustomDrawOrderFabric_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(6, "enableCustomDrawOrderFabric");

    flagValue = currentProvider_->enableCustomDrawOrderFabric();
    enableCustomDrawOrderFabric_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::enableFixForClippedSubviewsCrash() {
  auto flagValue = enableFixForClippedSubviewsCrash_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(7, "enableFixForClippedSubviewsCrash");

    flagValue = currentProvider_->enableFixForClippedSubviewsCrash();
    enableFixForClippedSubviewsCrash_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::inspectorEnableCxxInspectorPackagerConnection() {
  auto flagValue = inspectorEnableCxxInspectorPackagerConnection_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(8, "inspectorEnableCxxInspectorPackagerConnection");

    flagValue = currentProvider_->inspectorEnableCxxInspectorPackagerConnection();
    inspectorEnableCxxInspectorPackagerConnection_ = flagValue;
  }

  return flagValue.value();
}

bool ReactNativeFeatureFlagsAccessor::inspectorEnableModernCDPRegistry() {
  auto flagValue = inspectorEnableModernCDPRegistry_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    markFlagAsAccessed(9, "inspectorEnableModernCDPRegistry");

    flagValue = currentProvider_->inspectorEnableModernCDPRegistry();
    inspectorEnableModernCDPRegistry_ = flagValue;
  }

  return flagValue.value();
}

void ReactNativeFeatureFlagsAccessor::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  if (wasOverridden_) {
    throw std::runtime_error(
        "Feature flags cannot be overridden more than once");
  }

  ensureFlagsNotAccessed();
  wasOverridden_ = true;
  currentProvider_ = std::move(provider);
}

void ReactNativeFeatureFlagsAccessor::markFlagAsAccessed(
    int position,
    const char* flagName) {
  accessedFeatureFlags_[position] = flagName;
}

void ReactNativeFeatureFlagsAccessor::ensureFlagsNotAccessed() {
  std::ostringstream featureFlagListBuilder;
  for (const auto& featureFlagName : accessedFeatureFlags_) {
    if (featureFlagName != nullptr) {
      featureFlagListBuilder << featureFlagName << ", ";
    }
  }

  std::string accessedFeatureFlagNames = featureFlagListBuilder.str();
  if (!accessedFeatureFlagNames.empty()) {
    accessedFeatureFlagNames =
        accessedFeatureFlagNames.substr(0, accessedFeatureFlagNames.size() - 2);
  }

  if (!accessedFeatureFlagNames.empty()) {
    throw std::runtime_error(
        "Feature flags were accessed before being overridden: " +
        accessedFeatureFlagNames);
  }
}

} // namespace facebook::react
