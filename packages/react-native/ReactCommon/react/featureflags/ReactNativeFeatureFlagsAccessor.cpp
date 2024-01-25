/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<7f8b2ae5c0b18aceeaac0ee60e53bdbb>>
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
  if (!commonTestFlag_.has_value()) {
    // Mark the flag as accessed.
    static const char* flagName = "commonTestFlag";
    if (std::find(
            accessedFeatureFlags_.begin(),
            accessedFeatureFlags_.end(),
            flagName) == accessedFeatureFlags_.end()) {
      accessedFeatureFlags_.push_back(flagName);
    }

    commonTestFlag_.emplace(currentProvider_->commonTestFlag());
  }

  return commonTestFlag_.value();
}

void ReactNativeFeatureFlagsAccessor::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  if (!accessedFeatureFlags_.empty()) {
    std::ostringstream featureFlagListBuilder;
    for (const auto& featureFlagName : accessedFeatureFlags_) {
      featureFlagListBuilder << featureFlagName << ", ";
    }
    std::string accessedFeatureFlagNames = featureFlagListBuilder.str();
    if (!accessedFeatureFlagNames.empty()) {
      accessedFeatureFlagNames = accessedFeatureFlagNames.substr(
          0, accessedFeatureFlagNames.size() - 2);
    }

    throw std::runtime_error(
        "Feature flags were accessed before being overridden: " +
        accessedFeatureFlagNames);
  }

  currentProvider_ = std::move(provider);
}

} // namespace facebook::react
