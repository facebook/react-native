/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {DO_NOT_MODIFY_COMMENT} = require('../../utils');
const signedsource = require('signedsource');

module.exports = config =>
  signedsource.signFile(`/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 * @flow strict-local
 */

${DO_NOT_MODIFY_COMMENT}

import {
  type Getter,
  createJavaScriptFlagGetter,
  createNativeFlagGetter,
  setOverrides,
} from './ReactNativeFeatureFlagsBase';

export type ReactNativeFeatureFlagsJsOnly = {
${Object.entries(config.jsOnly)
  .map(
    ([flagName, flagConfig]) =>
      `  ${flagName}: Getter<${typeof flagConfig.defaultValue}>,`,
  )
  .join('\n')}
};

export type ReactNativeFeatureFlagsJsOnlyOverrides = Partial<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = {
  ...ReactNativeFeatureFlagsJsOnly,
${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `  ${flagName}: Getter<${typeof flagConfig.defaultValue}>,`,
  )
  .join('\n')}
}

${Object.entries(config.jsOnly)
  .map(
    ([flagName, flagConfig]) =>
      `/**
 * ${flagConfig.description}
 */
export const ${flagName}: Getter<${typeof flagConfig.defaultValue}> = createJavaScriptFlagGetter('${flagName}', ${JSON.stringify(
        flagConfig.defaultValue,
      )});`,
  )
  .join('\n\n')}

${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `/**
 * ${flagConfig.description}
 */
export const ${flagName}: Getter<${typeof flagConfig.defaultValue}> = createNativeFlagGetter('${flagName}', ${JSON.stringify(
        flagConfig.defaultValue,
      )});`,
  )
  .join('\n')}

/**
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
`);
