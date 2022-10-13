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
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
} = require('../error-utils');

const {
  UnsupportedFunctionReturnTypeAnnotationParserError,
} = require('../errors');

describe('throwIfUnsupportedFunctionReturnTypeAnnotationParserError', () => {
  const flowReturnTypeAnnotation = {
      returnType: '',
    },
    nativeModuleName = 'moduleName',
    invalidReturnType = 'FunctionTypeAnnotation',
    language = 'Flow';

  it('do not throw error if cxxOnly is true', () => {
    const cxxOnly = true,
      returnTypeAnnotation = {
        type: 'FunctionTypeAnnotation',
      };

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        flowReturnTypeAnnotation,
        invalidReturnType,
        language,
        cxxOnly,
        returnTypeAnnotation,
      );
    }).not.toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });

  it('do not throw error if returnTypeAnnotation type is not FunctionTypeAnnotation', () => {
    const cxxOnly = false,
      returnTypeAnnotation = {
        type: '',
      };

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        flowReturnTypeAnnotation,
        invalidReturnType,
        language,
        cxxOnly,
        returnTypeAnnotation,
      );
    }).not.toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });

  it('throw error if cxxOnly is false and returnTypeAnnotation type is FunctionTypeAnnotation', () => {
    const cxxOnly = false,
      returnTypeAnnotation = {
        type: 'FunctionTypeAnnotation',
      };

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        flowReturnTypeAnnotation,
        invalidReturnType,
        language,
        cxxOnly,
        returnTypeAnnotation,
      );
    }).toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });
});
