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

describe('throwIfMoreThanOneModuleRegistryCalls', () => {
  const {throwIfModuleTypeIsUnsupported} = require('../error-utils.js');
  const {UnsupportedModulePropertyParserError} = require('../errors.js');
  const hasteModuleName = 'moduleName';
  const property = {value: 'value', key: {name: 'name'}};
  it("don't throw error if module type is FunctionTypeAnnotation in Flow", () => {
    const value = {type: 'FunctionTypeAnnotation'};
    const language = 'Flow';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it('throw error if module type is unsupported in Flow', () => {
    const value = {type: ''};
    const language = 'Flow';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).toThrow(UnsupportedModulePropertyParserError);
  });
  it("don't throw error if module type is TSFunctionType in TypeScript", () => {
    const value = {type: 'TSFunctionType'};
    const language = 'TypeScript';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it("don't throw error if module type is TSMethodSignature in TypeScript", () => {
    const value = {type: 'TSMethodSignature'};
    const language = 'TypeScript';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it('throw error if module type is unsupported in TypeScript', () => {
    const value = {type: ''};
    const language = 'TypeScript';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).toThrow(UnsupportedModulePropertyParserError);
  });
});
