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

const {
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UnusedModuleInterfaceParserError,
} = require('./errors.js');

function throwIfModuleInterfaceNotFound(
  numberOfModuleSpecs: number,
  nativeModuleName: string,
  ast: $FlowFixMe,
  parserType: ParserType,
) {
  if (numberOfModuleSpecs === 0) {
    throw new ModuleInterfaceNotFoundParserError(
      nativeModuleName,
      ast,
      parserType,
    );
  }
}

function throwIfMoreThanOneModuleRegistryCalls(
  hasteModuleName: string,
  callExpressions: $FlowFixMe,
  callExpressionsLength: number,
  language: ParserType,
) {
  if (callExpressions.length > 1) {
    throw new MoreThanOneModuleRegistryCallsParserError(
      hasteModuleName,
      callExpressions,
      callExpressionsLength,
      language,
    );
  }
}

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
  throwIfModuleInterfaceNotFound,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfUnusedModuleInterfaceParserError,
};
