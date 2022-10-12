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

const {UntypedModuleRegistryCallParserError} = require('./errors');

function throwIfUntypedModule(
  typeArguments: $FlowFixMe,
  hasteModuleName: string,
  callExpression: $FlowFixMe,
  methodName: string,
  $moduleName: string,
  language: ParserType,
) {
  if (typeArguments == null) {
    throw new UntypedModuleRegistryCallParserError(
      hasteModuleName,
      callExpression,
      methodName,
      $moduleName,
      language,
    );
  }
}

module.exports = {
  throwIfUntypedModule,
};
