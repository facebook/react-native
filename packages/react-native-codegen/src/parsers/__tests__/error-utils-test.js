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

describe('throwIfModuleInterfaceIsMisnamed', () => {
  const {throwIfModuleInterfaceIsMisnamed} = require('../error-utils.js');
  const {MisnamedModuleInterfaceParserError} = require('../errors.js');
  it("don't throw error if module interface name is Spec", () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Spec'};
    const parserType = 'Flow';

    expect(() => {
      throwIfModuleInterfaceIsMisnamed(nativeModuleName, specId, parserType);
    }).not.toThrow(MisnamedModuleInterfaceParserError);
  });
  it('throw error if module interface is misnamed', () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Name'};
    const parserType = 'TypeScript';

    expect(() => {
      throwIfModuleInterfaceIsMisnamed(nativeModuleName, specId, parserType);
    }).toThrow(MisnamedModuleInterfaceParserError);
  });
});
