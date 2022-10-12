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

describe('throwIfUntypedModule', () => {
  const {throwIfUntypedModule} = require('../error-utils');
  const {UntypedModuleRegistryCallParserError} = require('../errors');
  const hasteModuleName = 'moduleName';
  const methodName = 'methodName';
  const moduleName = 'moduleName';
  const callExpressions = [];

  it('should throw error if module does not have a type', () => {
    const typeArguments = null;
    const language = 'Flow';
    expect(() =>
      throwIfUntypedModule(
        typeArguments,
        hasteModuleName,
        callExpressions,
        methodName,
        moduleName,
        language,
      ),
    ).toThrowError(UntypedModuleRegistryCallParserError);
  });

  it('should not throw error if module have a type', () => {
    const typeArguments = {
      type: 'TSTypeParameterInstantiations',
      params: [],
    };

    const language = 'TypeScript';
    expect(() =>
      throwIfUntypedModule(
        typeArguments,
        hasteModuleName,
        callExpressions,
        methodName,
        moduleName,
        language,
      ),
    ).not.toThrowError(UntypedModuleRegistryCallParserError);
  });
});
