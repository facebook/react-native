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
  getCxxTypeFromDefaultValue,
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

#pragma once

namespace facebook::react {

class ReactNativeFeatureFlagsProvider {
 public:
  virtual ~ReactNativeFeatureFlagsProvider() = default;

${Object.entries(config.common)
  .map(
    ([flagName, flagConfig]) =>
      `  virtual ${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} ${flagName}() = 0;`,
  )
  .join('\n')}
};

} // namespace facebook::react
`);
