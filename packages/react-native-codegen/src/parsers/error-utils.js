/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ParserType} from './errors';

const {UnusedModuleInterfaceParserError} = require('./errors');

function throwIfUnusedModuleInterfaceParserError(
  nativeModuleName: string,
  moduleSpec: $FlowFixMe,
  callExpressions: $FlowFixMe,
  language: ParserType,
) {
  if (callExpressions.length === 0) {
    throw new UnusedModuleInterfaceParserError(
      nativeModuleName,
      moduleSpec,
      language,
    );
  }
}

module.exports = {
  throwIfUnusedModuleInterfaceParserError,
};
