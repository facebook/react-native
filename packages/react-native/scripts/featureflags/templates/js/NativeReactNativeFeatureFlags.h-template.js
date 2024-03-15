/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagDefinitions} from '../../types';

import {DO_NOT_MODIFY_COMMENT, getCxxTypeFromDefaultValue} from '../../utils';
import signedsource from 'signedsource';

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

#if __has_include("rncoreJSI.h") // Cmake headers on Android
#include "rncoreJSI.h"
#elif __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

namespace facebook::react {

class NativeReactNativeFeatureFlags
    : public NativeReactNativeFeatureFlagsCxxSpec<
          NativeReactNativeFeatureFlags> {
 public:
  NativeReactNativeFeatureFlags(std::shared_ptr<CallInvoker> jsInvoker);

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  ${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} ${flagName}(jsi::Runtime& runtime);`,
  )
  .join('\n\n')}
};

} // namespace facebook::react
`);
}
