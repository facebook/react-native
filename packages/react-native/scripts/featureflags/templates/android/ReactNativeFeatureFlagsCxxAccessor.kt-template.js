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

public class ReactNativeFeatureFlagsCxxAccessor : ReactNativeFeatureFlagsAccessor {
${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  private var ${flagName}Cache: ${getKotlinTypeFromDefaultValue(
        flagConfig.defaultValue,
      )}? = null`,
  )
  .join('\n')}

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) => `  override fun ${flagName}(): Boolean {
    var cached = ${flagName}Cache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.${flagName}()
      ${flagName}Cache = cached
    }
    return cached
  }`,
  )
  .join('\n\n')}

  override fun override(provider: ReactNativeFeatureFlagsProvider): Unit =
      ReactNativeFeatureFlagsCxxInterop.override(provider as Any)

  override fun dangerouslyReset(): Unit = ReactNativeFeatureFlagsCxxInterop.dangerouslyReset()
}
`);
}
