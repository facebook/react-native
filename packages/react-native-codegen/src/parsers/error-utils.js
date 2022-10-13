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
  UnsupportedFunctionReturnTypeAnnotationParserError,
} = require('./errors.js');

function throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
  nativeModuleName: string,
  flowReturnTypeAnnotation: $FlowFixMe,
  invalidReturnType: string,
  language: ParserType,
  cxxOnly: boolean,
  returnTypeAnnotation: $FlowFixMe,
) {
  if (!cxxOnly && returnTypeAnnotation.type === 'FunctionTypeAnnotation') {
    throw new UnsupportedFunctionReturnTypeAnnotationParserError(
      nativeModuleName,
      flowReturnTypeAnnotation.returnType,
      'FunctionTypeAnnotation',
      language,
    );
  }
}

module.exports = {
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
};
