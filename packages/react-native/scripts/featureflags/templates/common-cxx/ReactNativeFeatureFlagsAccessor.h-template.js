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

#pragma once

#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <memory>
#include <optional>
#include <vector>

namespace facebook::react {

class ReactNativeFeatureFlagsAccessor {
 public:
  ReactNativeFeatureFlagsAccessor();

${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `  ${getCxxTypeFromDefaultValue(flagConfig.defaultValue)} ${flagName}();`,
  )
  .join('\n')}

  void override(std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

 private:
  std::unique_ptr<ReactNativeFeatureFlagsProvider> currentProvider_;
  std::vector<const char*> accessedFeatureFlags_;

${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `  std::optional<${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )}> ${flagName}_;`,
  )
  .join('\n')}
};

} // namespace facebook::react
`);
