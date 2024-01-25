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
  getKotlinTypeFromDefaultValue,
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

package com.facebook.react.internal.featureflags

class ReactNativeFeatureFlagsCxxAccessor : ReactNativeFeatureFlagsAccessor {
${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `  private var ${flagName}Cache: ${getKotlinTypeFromDefaultValue(
        flagConfig.defaultValue,
      )}? = null`,
  )
  .join('\n')}

${Object.entries(config.common)
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

  override fun override(provider: ReactNativeFeatureFlagsProvider) =
      ReactNativeFeatureFlagsCxxInterop.override(provider as Any)

  override fun dangerouslyReset() = ReactNativeFeatureFlagsCxxInterop.dangerouslyReset()
}
`);
