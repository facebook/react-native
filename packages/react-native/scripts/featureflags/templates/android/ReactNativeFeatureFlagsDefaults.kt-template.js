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

import {
  DO_NOT_MODIFY_COMMENT,
  getKotlinTypeFromDefaultValue,
  getKotlinValueFromDefaultValue,
} from '../../utils';
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

package com.facebook.react.internal.featureflags

public open class ReactNativeFeatureFlagsDefaults : ReactNativeFeatureFlagsProvider {
  // We could use JNI to get the defaults from C++,
  // but that is more expensive than just duplicating the defaults here.

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  override fun ${flagName}(): ${getKotlinTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} = ${getKotlinValueFromDefaultValue(flagConfig.defaultValue)}`,
  )
  .join('\n\n')}
}
`);
}
