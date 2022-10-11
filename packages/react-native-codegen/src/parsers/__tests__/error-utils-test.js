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

const {throwIfWrongNumberOfCallExpressionArgs} = require('../error-utils');
const {IncorrectModuleRegistryCallArityParserError} = require('../errors');

describe('throwErrorIfWrongNumberOfCallExpressionArgs', () => {
  it('throw error if wrong number of call expression args is used', () => {
    const nativeModuleName = 'moduleName';
    const flowCallExpression = {argument: []};
    const methodName = 'methodName';
    const numberOfCallExpressionArgs = flowCallExpression.argument.length;
    const language = 'Flow';
    expect(() => {
      throwIfWrongNumberOfCallExpressionArgs(
        nativeModuleName,
        flowCallExpression,
        methodName,
        numberOfCallExpressionArgs,
        language,
      );
    }).toThrow(IncorrectModuleRegistryCallArityParserError);
  });

  it("don't throw error if correct number of call expression args is used", () => {
    const nativeModuleName = 'moduleName';
    const flowCallExpression = {argument: ['argument']};
    const methodName = 'methodName';
    const numberOfCallExpressionArgs = flowCallExpression.argument.length;
    const language = 'Flow';
    expect(() => {
      throwIfWrongNumberOfCallExpressionArgs(
        nativeModuleName,
        flowCallExpression,
        methodName,
        numberOfCallExpressionArgs,
        language,
      );
    }).not.toThrow(IncorrectModuleRegistryCallArityParserError);
  });
});
