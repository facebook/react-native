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
  IncorrectModuleRegistryCallTypeParameterParserError,
} = require('./errors.js');

function throwIfIncorrectModuleRegistryCallTypeParameterParserError(
  nativeModuleName: string,
  flowTypeArguments: $FlowFixMe,
  methodName: string,
  moduleName: string,
  language: ParserType,
) {
  function throwError() {
    throw new IncorrectModuleRegistryCallTypeParameterParserError(
      nativeModuleName,
      flowTypeArguments,
      methodName,
      moduleName,
      language,
    );
  }

  if (language === 'Flow') {
    if (
      flowTypeArguments.type !== 'TypeParameterInstantiation' ||
      flowTypeArguments.params.length !== 1 ||
      flowTypeArguments.params[0].type !== 'GenericTypeAnnotation' ||
      flowTypeArguments.params[0].id.name !== 'Spec'
    ) {
      throwError();
    }
  } else if (language === 'TypeScript') {
    if (
      flowTypeArguments.type !== 'TSTypeParameterInstantiation' ||
      flowTypeArguments.params.length !== 1 ||
      flowTypeArguments.params[0].type !== 'TSTypeReference' ||
      flowTypeArguments.params[0].typeName.name !== 'Spec'
    ) {
      throwError();
    }
  }
}

module.exports = {
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
};
