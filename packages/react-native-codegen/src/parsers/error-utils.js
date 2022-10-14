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
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UnusedModuleInterfaceParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  UntypedModuleRegistryCallParserError,
  UnsupportedModulePropertyParserError,
} = require('./errors.js');

function throwIfModuleInterfaceNotFound(
  numberOfModuleSpecs: number,
  nativeModuleName: string,
  ast: $FlowFixMe,
  parserType: ParserType,
) {
  if (numberOfModuleSpecs === 0) {
    throw new ModuleInterfaceNotFoundParserError(
      nativeModuleName,
      ast,
      parserType,
    );
  }
}

function throwIfMoreThanOneModuleRegistryCalls(
  hasteModuleName: string,
  callExpressions: $FlowFixMe,
  callExpressionsLength: number,
  language: ParserType,
) {
  if (callExpressions.length > 1) {
    throw new MoreThanOneModuleRegistryCallsParserError(
      hasteModuleName,
      callExpressions,
      callExpressionsLength,
      language,
    );
  }
}

function throwIfUnusedModuleInterfaceParserError(
  nativeModuleName: string,
  moduleSpec: $FlowFixMe,
  callExpressions: $FlowFixMe,
  language: ParserType,
) {
  if (callExpressions.length === 0) {
    throw new UnusedModuleInterfaceParserError(
      nativeModuleName,
      moduleSpec,
      language,
    );
  }
}

function throwIfWrongNumberOfCallExpressionArgs(
  nativeModuleName: string,
  flowCallExpression: $FlowFixMe,
  methodName: string,
  numberOfCallExpressionArgs: number,
  language: ParserType,
) {
  if (numberOfCallExpressionArgs !== 1) {
    throw new IncorrectModuleRegistryCallArityParserError(
      nativeModuleName,
      flowCallExpression,
      methodName,
      numberOfCallExpressionArgs,
      language,
    );
  }
}

function throwIfIncorrectModuleRegistryCallTypeParameterParserError(
  nativeModuleName: string,
  typeArguments: $FlowFixMe,
  methodName: string,
  moduleName: string,
  language: ParserType,
) {
  function throwError() {
    throw new IncorrectModuleRegistryCallTypeParameterParserError(
      nativeModuleName,
      typeArguments,
      methodName,
      moduleName,
      language,
    );
  }

  if (language === 'Flow') {
    if (
      typeArguments.type !== 'TypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'GenericTypeAnnotation' ||
      typeArguments.params[0].id.name !== 'Spec'
    ) {
      throwError();
    }
  } else if (language === 'TypeScript') {
    if (
      typeArguments.type !== 'TSTypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'TSTypeReference' ||
      typeArguments.params[0].typeName.name !== 'Spec'
    ) {
      throwError();
    }
  }
}

function throwIfUntypedModule(
  typeArguments: $FlowFixMe,
  hasteModuleName: string,
  callExpression: $FlowFixMe,
  methodName: string,
  $moduleName: string,
  language: ParserType,
) {
  if (typeArguments == null) {
    throw new UntypedModuleRegistryCallParserError(
      hasteModuleName,
      callExpression,
      methodName,
      $moduleName,
      language,
    );
  }
}

function throwIfModuleTypeIsUnsupported(
  nativeModuleName: string,
  propertyValue: $FlowFixMe,
  propertyName: string,
  propertyValueType: string,
  language: ParserType,
) {
  if (language === 'Flow' && propertyValueType !== 'FunctionTypeAnnotation') {
    throw new UnsupportedModulePropertyParserError(
      nativeModuleName,
      propertyValue,
      propertyName,
      propertyValueType,
      language,
    );
  } else if (
    language === 'TypeScript' &&
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

module.exports = {
  throwIfModuleInterfaceNotFound,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfUntypedModule,
  throwIfModuleTypeIsUnsupported,
};
