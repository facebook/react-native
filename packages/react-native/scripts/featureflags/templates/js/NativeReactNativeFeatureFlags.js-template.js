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

import type {TurboModule} from '../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `  +${flagName}?: () => ${typeof flagConfig.defaultValue};`,
  )
  .join('\n')}
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
`);
