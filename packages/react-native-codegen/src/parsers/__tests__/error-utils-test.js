/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @oncall react_native
 */

'use strict';

const {
  throwIfIncorrectModuleRegistryCallArityParserError,
} = require('../error-utils');
const {IncorrectModuleRegistryCallArityParserError} = require('../errors');

describe('throwIfIncorrectModuleRegistryCallArityParserError', () => {
  it('throw error if incorrect module registry call arity is used', () => {
    const nativeModuleName = 'moduleName';
    const flowCallExpression = {argument: []};
    const methodName = 'methodName';
    const incorrectArity = flowCallExpression.argument.length;
    const language = 'Flow';
    expect(() => {
      throwIfIncorrectModuleRegistryCallArityParserError(
        nativeModuleName,
        flowCallExpression,
        methodName,
        incorrectArity,
        language,
      );
    }).toThrow(IncorrectModuleRegistryCallArityParserError);
  });

  it("don't throw error if correct module registry call arity is used", () => {
    const nativeModuleName = 'moduleName';
    const flowCallExpression = {argument: ['argument']};
    const methodName = 'methodName';
    const incorrectArity = flowCallExpression.argument.length;
    const language = 'Flow';
    expect(() => {
      throwIfIncorrectModuleRegistryCallArityParserError(
        nativeModuleName,
        flowCallExpression,
        methodName,
        incorrectArity,
        language,
      );
    }).not.toThrow(IncorrectModuleRegistryCallArityParserError);
  });
});
