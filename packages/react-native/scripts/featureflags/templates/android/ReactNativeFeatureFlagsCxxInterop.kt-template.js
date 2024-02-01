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

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

@DoNotStrip
object ReactNativeFeatureFlagsCxxInterop {
  init {
    SoLoader.loadLibrary("react_featureflagsjni")
  }

${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `  @DoNotStrip @JvmStatic external fun ${flagName}(): ${getKotlinTypeFromDefaultValue(
        flagConfig.defaultValue,
      )}`,
  )
  .join('\n\n')}

  @DoNotStrip @JvmStatic external fun override(provider: Any)

  @DoNotStrip @JvmStatic external fun dangerouslyReset()
}
`);
