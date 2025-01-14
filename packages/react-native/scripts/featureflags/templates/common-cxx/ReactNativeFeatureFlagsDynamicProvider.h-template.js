/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  CommonFeatureFlagConfig,
  FeatureFlagDefinitions,
} from '../../types';

import {DO_NOT_MODIFY_COMMENT, getCxxTypeFromDefaultValue} from '../../utils';
import signedsource from 'signedsource';

function getFollyDynamicAccessor(config: CommonFeatureFlagConfig): string {
  switch (typeof config.defaultValue) {
    case 'boolean':
      return 'getBool';
    case 'number':
      return 'getInt';
    case 'string':
      return 'getString';
    default:
      throw new Error(`Unsupported type: ${typeof config.defaultValue}`);
  }
}

export default function (definitions: FeatureFlagDefinitions): string {
  return signedsource.signFile(`/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 */

${DO_NOT_MODIFY_COMMENT}

#pragma once

#include <folly/dynamic.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

namespace facebook::react {

/**
 * This class is a ReactNativeFeatureFlags provider that takes the values for
 * feature flags from a folly::dynamic object (e.g. from a JSON object), if
 * they are defined. For the flags not defined in the object, it falls back to
 * the default values defined in ReactNativeFeatureFlagsDefaults.
 *
 * The API is strict about typing. It ignores null values from the
 * folly::dynamic object, but if the key is defined, the value must have the
 * correct type or otherwise throws an exception.
 */
class ReactNativeFeatureFlagsDynamicProvider : public ReactNativeFeatureFlagsDefaults {
 private:
  folly::dynamic values_;

 public:
  ReactNativeFeatureFlagsDynamicProvider(folly::dynamic values): values_(std::move(values)) {
    if (!values_.isObject()) {
      throw std::invalid_argument("ReactNativeFeatureFlagsDynamicProvider: values must be an object");
    }
  }

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  ${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} ${flagName}() override {
    auto value = values_["${flagName}"];
    if (!value.isNull()) {
      return value.${getFollyDynamicAccessor(flagConfig)}();
    }

    return ReactNativeFeatureFlagsDefaults::${flagName}();
  }`,
  )
  .join('\n\n')}
};

} // namespace facebook::react
`);
}
