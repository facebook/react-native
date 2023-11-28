/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const _require = require('./errors'),
  MisnamedModuleInterfaceParserError =
    _require.MisnamedModuleInterfaceParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError =
    _require.UnsupportedFunctionReturnTypeAnnotationParserError,
  ModuleInterfaceNotFoundParserError =
    _require.ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleRegistryCallsParserError =
    _require.MoreThanOneModuleRegistryCallsParserError,
  UnusedModuleInterfaceParserError = _require.UnusedModuleInterfaceParserError,
  IncorrectModuleRegistryCallArityParserError =
    _require.IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallTypeParameterParserError =
    _require.IncorrectModuleRegistryCallTypeParameterParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError =
    _require.IncorrectModuleRegistryCallArgumentTypeParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError =
    _require.UnsupportedObjectPropertyValueTypeAnnotationParserError,
  UntypedModuleRegistryCallParserError =
    _require.UntypedModuleRegistryCallParserError,
  UnsupportedModulePropertyParserError =
    _require.UnsupportedModulePropertyParserError,
  MoreThanOneModuleInterfaceParserError =
    _require.MoreThanOneModuleInterfaceParserError,
  UnsupportedFunctionParamTypeAnnotationParserError =
    _require.UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedArrayElementTypeAnnotationParserError =
    _require.UnsupportedArrayElementTypeAnnotationParserError;
function throwIfModuleInterfaceIsMisnamed(
  nativeModuleName,
  moduleSpecId,
  parserType,
) {
  if (moduleSpecId.name !== 'Spec') {
    throw new MisnamedModuleInterfaceParserError(
      nativeModuleName,
      moduleSpecId,
      parserType,
    );
  }
}
function throwIfModuleInterfaceNotFound(
  numberOfModuleSpecs,
  nativeModuleName,
  ast,
  parserType,
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
  hasteModuleName,
  callExpressions,
  callExpressionsLength,
) {
  if (callExpressions.length > 1) {
    throw new MoreThanOneModuleRegistryCallsParserError(
      hasteModuleName,
      callExpressions,
      callExpressionsLength,
    );
  }
}
function throwIfUnusedModuleInterfaceParserError(
  nativeModuleName,
  moduleSpec,
  callExpressions,
) {
  if (callExpressions.length === 0) {
    throw new UnusedModuleInterfaceParserError(nativeModuleName, moduleSpec);
  }
}
function throwIfWrongNumberOfCallExpressionArgs(
  nativeModuleName,
  flowCallExpression,
  methodName,
  numberOfCallExpressionArgs,
) {
  if (numberOfCallExpressionArgs !== 1) {
    throw new IncorrectModuleRegistryCallArityParserError(
      nativeModuleName,
      flowCallExpression,
      methodName,
      numberOfCallExpressionArgs,
    );
  }
}
function throwIfIncorrectModuleRegistryCallTypeParameterParserError(
  nativeModuleName,
  typeArguments,
  methodName,
  moduleName,
  parser,
) {
  function throwError() {
    throw new IncorrectModuleRegistryCallTypeParameterParserError(
      nativeModuleName,
      typeArguments,
      methodName,
      moduleName,
    );
  }
  if (parser.checkIfInvalidModule(typeArguments)) {
    throwError();
  }
}
function throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
  nativeModuleName,
  returnTypeAnnotation,
  invalidReturnType,
  cxxOnly,
  returnType,
) {
  if (!cxxOnly && returnType === 'FunctionTypeAnnotation') {
    throw new UnsupportedFunctionReturnTypeAnnotationParserError(
      nativeModuleName,
      returnTypeAnnotation.returnType,
      'FunctionTypeAnnotation',
    );
  }
}
function throwIfUntypedModule(
  typeArguments,
  hasteModuleName,
  callExpression,
  methodName,
  moduleName,
) {
  if (typeArguments == null) {
    throw new UntypedModuleRegistryCallParserError(
      hasteModuleName,
      callExpression,
      methodName,
      moduleName,
    );
  }
}
function throwIfModuleTypeIsUnsupported(
  nativeModuleName,
  propertyValue,
  propertyName,
  propertyValueType,
  parser,
) {
  if (!parser.functionTypeAnnotation(propertyValueType)) {
    throw new UnsupportedModulePropertyParserError(
      nativeModuleName,
      propertyValue,
      propertyName,
      propertyValueType,
      parser.language(),
    );
  }
}
const UnsupportedObjectPropertyTypeToInvalidPropertyValueTypeMap = {
  FunctionTypeAnnotation: 'FunctionTypeAnnotation',
  VoidTypeAnnotation: 'void',
  PromiseTypeAnnotation: 'Promise',
};
function throwIfPropertyValueTypeIsUnsupported(
  moduleName,
  propertyValue,
  propertyKey,
  type,
) {
  const invalidPropertyValueType =
    UnsupportedObjectPropertyTypeToInvalidPropertyValueTypeMap[type];
  throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
    moduleName,
    propertyValue,
    propertyKey,
    invalidPropertyValueType,
  );
}
function throwIfMoreThanOneModuleInterfaceParserError(
  nativeModuleName,
  moduleSpecs,
  parserType,
) {
  if (moduleSpecs.length > 1) {
    throw new MoreThanOneModuleInterfaceParserError(
      nativeModuleName,
      moduleSpecs,
      moduleSpecs.map(node => node.id.name),
      parserType,
    );
  }
}
function throwIfUnsupportedFunctionParamTypeAnnotationParserError(
  nativeModuleName,
  languageParamTypeAnnotation,
  paramName,
  paramTypeAnnotationType,
) {
  throw new UnsupportedFunctionParamTypeAnnotationParserError(
    nativeModuleName,
    languageParamTypeAnnotation,
    paramName,
    paramTypeAnnotationType,
  );
}
function throwIfArrayElementTypeAnnotationIsUnsupported(
  hasteModuleName,
  flowElementType,
  flowArrayType,
  type,
) {
  const TypeMap = {
    FunctionTypeAnnotation: 'FunctionTypeAnnotation',
    VoidTypeAnnotation: 'void',
    PromiseTypeAnnotation: 'Promise',
    // TODO: Added as a work-around for now until TupleTypeAnnotation are fully supported in both flow and TS
    // Right now they are partially treated as UnionTypeAnnotation
    UnionTypeAnnotation: 'UnionTypeAnnotation',
  };
  if (type in TypeMap) {
    throw new UnsupportedArrayElementTypeAnnotationParserError(
      hasteModuleName,
      flowElementType,
      flowArrayType,
      TypeMap[type],
    );
  }
}
function throwIfIncorrectModuleRegistryCallArgument(
  nativeModuleName,
  callExpressionArg,
  methodName,
) {
  if (
    callExpressionArg.type !== 'StringLiteral' &&
    callExpressionArg.type !== 'Literal'
  ) {
    const type = callExpressionArg.type;
    throw new IncorrectModuleRegistryCallArgumentTypeParserError(
      nativeModuleName,
      callExpressionArg,
      methodName,
      type,
    );
  }
}
function throwIfPartialNotAnnotatingTypeParameter(
  typeAnnotation,
  types,
  parser,
) {
  const annotatedElement = parser.extractAnnotatedElement(
    typeAnnotation,
    types,
  );
  if (!annotatedElement) {
    throw new Error('Partials only support annotating a type parameter.');
  }
}
function throwIfPartialWithMoreParameter(typeAnnotation) {
  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new Error('Partials only support annotating exactly one parameter.');
  }
}
function throwIfMoreThanOneCodegenNativecommands(commandsTypeNames) {
  if (commandsTypeNames.length > 1) {
    throw new Error('codegenNativeCommands may only be called once in a file');
  }
}
function throwIfConfigNotfound(foundConfigs) {
  if (foundConfigs.length === 0) {
    throw new Error('Could not find component config for native component');
  }
}
function throwIfMoreThanOneConfig(foundConfigs) {
  if (foundConfigs.length > 1) {
    throw new Error('Only one component is supported per file');
  }
}
function throwIfEventHasNoName(typeAnnotation, parser) {
  const name =
    parser.language() === 'Flow' ? typeAnnotation.id : typeAnnotation.typeName;
  if (!name) {
    throw new Error("typeAnnotation of event doesn't have a name");
  }
}
function throwIfBubblingTypeIsNull(bubblingType, eventName) {
  if (!bubblingType) {
    throw new Error(
      `Unable to determine event bubbling type for "${eventName}"`,
    );
  }
  return bubblingType;
}
function throwIfArgumentPropsAreNull(argumentProps, eventName) {
  if (!argumentProps) {
    throw new Error(`Unable to determine event arguments for "${eventName}"`);
  }
  return argumentProps;
}
function throwIfTypeAliasIsNotInterface(typeAlias, parser) {
  if (typeAlias.type !== parser.interfaceDeclaration) {
    throw new Error(
      `The type argument for codegenNativeCommands must be an interface, received ${typeAlias.type}`,
    );
  }
}
module.exports = {
  throwIfModuleInterfaceIsMisnamed,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfModuleInterfaceNotFound,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfPropertyValueTypeIsUnsupported,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfUntypedModule,
  throwIfModuleTypeIsUnsupported,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfArrayElementTypeAnnotationIsUnsupported,
  throwIfIncorrectModuleRegistryCallArgument,
  throwIfPartialNotAnnotatingTypeParameter,
  throwIfPartialWithMoreParameter,
  throwIfMoreThanOneCodegenNativecommands,
  throwIfConfigNotfound,
  throwIfMoreThanOneConfig,
  throwIfEventHasNoName,
  throwIfBubblingTypeIsNull,
  throwIfArgumentPropsAreNull,
  throwIfTypeAliasIsNotInterface,
};
