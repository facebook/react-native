/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  DO_NOT_MODIFY_COMMENT,
  getCxxTypeFromDefaultValue,
} = require('../../utils');
const signedsource = require('signedsource');

module.exports = config =>
  signedsource.signFile(`/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 */

${DO_NOT_MODIFY_COMMENT}

#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <algorithm>
#include <sstream>
#include <stdexcept>
#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

ReactNativeFeatureFlagsAccessor::ReactNativeFeatureFlagsAccessor()
    : currentProvider_(std::make_unique<ReactNativeFeatureFlagsDefaults>()) {}

${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} ReactNativeFeatureFlagsAccessor::${flagName}() {
  if (!${flagName}_.has_value()) {
    // Mark the flag as accessed.
    static const char* flagName = "${flagName}";
    if (std::find(
            accessedFeatureFlags_.begin(),
            accessedFeatureFlags_.end(),
            flagName) == accessedFeatureFlags_.end()) {
      accessedFeatureFlags_.push_back(flagName);
    }

    ${flagName}_.emplace(currentProvider_->${flagName}());
  }

  return ${flagName}_.value();
}`,
  )
  .join('\n\n')}

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
`);
