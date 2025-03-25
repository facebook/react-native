/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagDefinitions, OSSReleaseStageValue} from '../../types';

import {
  DO_NOT_MODIFY_COMMENT,
  getKotlinTypeFromDefaultValue,
} from '../../utils';
import signedsource from 'signedsource';

function getClassSignature(ossReleaseStage: OSSReleaseStageValue): string {
  if (ossReleaseStage === 'experimental') {
    return 'ReactNativeFeatureFlagsOverrides_RNOSS_Experimental_Android : ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android()';
  } else if (ossReleaseStage === 'canary') {
    return 'ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android : ReactNativeFeatureFlagsDefaults()';
  }

  return 'ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android : ReactNativeFeatureFlagsProvider';
}

export default function (
  definitions: FeatureFlagDefinitions,
  ossReleaseStage: OSSReleaseStageValue,
): string {
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

public open class ${getClassSignature(ossReleaseStage)} {
  // We could use JNI to get the defaults from C++,
  // but that is more expensive than just duplicating the defaults here.

${Object.entries(definitions.common)
  .map(([flagName, flagConfig]) => {
    if (flagConfig.ossReleaseStage === ossReleaseStage) {
      return `  override fun ${flagName}(): ${getKotlinTypeFromDefaultValue(
        flagConfig.metadata.expectedReleaseValue,
      )} = ${JSON.stringify(flagConfig.metadata.expectedReleaseValue)}`;
    }
  })
  .filter(Boolean)
  .join('\n\n')}
}
`);
}
