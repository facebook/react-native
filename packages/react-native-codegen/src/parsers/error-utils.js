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

const {UnsupportedModulePropertyParserError} = require('./errors.js');

function throwIfModuleTypeIsUnsupported(
  nativeModuleName: string,
  propertyValue: $FlowFixMe,
  propertyName: string,
  propertyValueType: string,
  language: ParserType,
) {
  if (language === 'Flow') {
    if (propertyValueType !== 'FunctionTypeAnnotation') {
      throw new UnsupportedModulePropertyParserError(
        nativeModuleName,
        propertyValue,
        propertyName,
        propertyValueType,
        language,
      );
    }
  } else if (language === 'TypeScript') {
    if (
      propertyValueType !== 'TSFunctionType' &&
      propertyValueType !== 'TSMethodSignature'
    ) {
      throw new UnsupportedModulePropertyParserError(
        nativeModuleName,
        propertyValue,
        propertyName,
        propertyValueType,
        language,
      );
    }
  }
}

module.exports = {
  throwIfModuleTypeIsUnsupported,
};
