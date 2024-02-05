/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<ad8bfca49acda85e56fea1c124b5bc8a>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.json.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <algorithm>
#include <sstream>
#include <stdexcept>
#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

ReactNativeFeatureFlagsAccessor::ReactNativeFeatureFlagsAccessor()
    : currentProvider_(std::make_unique<ReactNativeFeatureFlagsDefaults>()) {}

bool ReactNativeFeatureFlagsAccessor::commonTestFlag() {
  auto flagValue = commonTestFlag_.load();

  if (!flagValue.has_value()) {
    // This block is not exclusive but it is not necessary.
    // If multiple threads try to initialize the feature flag, we would only
    // be accessing the provider multiple times but the end state of this
    // instance and the returned flag value would be the same.

    // Mark the flag as accessed.
    static const char* flagName = "commonTestFlag";
    markFlagAsAccessed(0, flagName);

    flagValue = currentProvider_->commonTestFlag();
    commonTestFlag_ = flagValue;
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

    // Mark the flag as accessed.
    static const char* flagName = "useModernRuntimeScheduler";
    markFlagAsAccessed(1, flagName);

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

    // Mark the flag as accessed.
    static const char* flagName = "enableMicrotasks";
    markFlagAsAccessed(2, flagName);

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

    // Mark the flag as accessed.
    static const char* flagName = "batchRenderingUpdatesInEventLoop";
    markFlagAsAccessed(3, flagName);

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

    // Mark the flag as accessed.
    static const char* flagName = "enableSpannableBuildingUnification";
    markFlagAsAccessed(4, flagName);

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

    // Mark the flag as accessed.
    static const char* flagName = "enableCustomDrawOrderFabric";
    markFlagAsAccessed(5, flagName);

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

    // Mark the flag as accessed.
    static const char* flagName = "enableFixForClippedSubviewsCrash";
    markFlagAsAccessed(6, flagName);

    flagValue = currentProvider_->enableFixForClippedSubviewsCrash();
    enableFixForClippedSubviewsCrash_ = flagValue;
  }

  return flagValue.value();
}

void ReactNativeFeatureFlagsAccessor::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  ensureFlagsNotAccessed();
  currentProvider_ = std::move(provider);
}

void ReactNativeFeatureFlagsAccessor::markFlagAsAccessed(
    int position,
    const char* flagName) {
  accessedFeatureFlags_[position] = flagName;
}

void ReactNativeFeatureFlagsAccessor::ensureFlagsNotAccessed() {
  std::string accessedFeatureFlagNames;

  std::ostringstream featureFlagListBuilder;
  for (const auto& featureFlagName : accessedFeatureFlags_) {
    if (featureFlagName != nullptr) {
      featureFlagListBuilder << featureFlagName << ", ";
    }
  }

  accessedFeatureFlagNames = featureFlagListBuilder.str();
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
