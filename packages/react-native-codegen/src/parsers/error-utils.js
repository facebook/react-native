/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

('use strict');

import type {ParserType} from './errors';

const {IncorrectModuleRegistryCallArityParserError} = require('./errors');

function throwIfIncorrectModuleRegistryCallArityParserError(
  nativeModuleName: string,
  flowCallExpression: $FlowFixMe,
  methodName: string,
  incorrectArity: number,
  language: ParserType,
) {
  if (incorrectArity !== 1) {
    throw new IncorrectModuleRegistryCallArityParserError(
      nativeModuleName,
      flowCallExpression,
      methodName,
      incorrectArity,
      language,
    );
  }
}

module.exports = {
  throwIfIncorrectModuleRegistryCallArityParserError,
};
