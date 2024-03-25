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

public class ReactNativeFeatureFlagsLocalAccessor : ReactNativeFeatureFlagsAccessor {
  private var currentProvider: ReactNativeFeatureFlagsProvider = ReactNativeFeatureFlagsDefaults()

  private val accessedFeatureFlags = mutableSetOf<String>()

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
      cached = currentProvider.${flagName}()
      accessedFeatureFlags.add("${flagName}")
      ${flagName}Cache = cached
    }
    return cached
  }`,
  )
  .join('\n\n')}

  override fun override(provider: ReactNativeFeatureFlagsProvider) {
    if (accessedFeatureFlags.isNotEmpty()) {
      val accessedFeatureFlagsStr = accessedFeatureFlags.joinToString(separator = ", ") { it }
      throw IllegalStateException(
          "Feature flags were accessed before being overridden: $accessedFeatureFlagsStr")
    }
    currentProvider = provider
  }

  override fun dangerouslyReset() {
    // We don't need to do anything here because \`ReactNativeFeatureFlags\` will
    // just create a new instance of this class.
  }
}
`);
}
