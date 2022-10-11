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

const {throwIfUnusedModuleInterfaceParserError} = require('../error-utils');
const {UnusedModuleInterfaceParserError} = require('../errors');

describe('throwIfUnusedModuleInterfaceParserError', () => {
  it('throw error if unused module', () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [];
    const spec = {name: 'Spec'};
    const parserType = 'Flow';
    expect(() => {
      throwIfUnusedModuleInterfaceParserError(
        nativeModuleName,
        spec,
        callExpressions,
        parserType,
      );
    }).toThrow(UnusedModuleInterfaceParserError);
  });

  it("don't throw error if module is used", () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [{name: 'callExpression1'}];
    const spec = {name: 'Spec'};
    const parserType = 'TypeScript';
    expect(() => {
      throwIfUnusedModuleInterfaceParserError(
        nativeModuleName,
        spec,
        callExpressions,
        parserType,
      );
    }).not.toThrow(UnusedModuleInterfaceParserError);
  });
});
