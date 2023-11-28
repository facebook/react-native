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

class ParserError extends Error {
  constructor(nativeModuleName, astNodeOrNodes, message) {
    super(`Module ${nativeModuleName}: ${message}`);
    this.nodes = Array.isArray(astNodeOrNodes)
      ? astNodeOrNodes
      : [astNodeOrNodes];

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
  }
}
class MisnamedModuleInterfaceParserError extends ParserError {
  constructor(nativeModuleName, id, language) {
    super(
      nativeModuleName,
      id,
      `All ${language} interfaces extending TurboModule must be called 'Spec'. Please rename ${language} interface '${id.name}' to 'Spec'.`,
    );
  }
}
class ModuleInterfaceNotFoundParserError extends ParserError {
  constructor(nativeModuleName, ast, language) {
    super(
      nativeModuleName,
      ast,
      `No ${language} interfaces extending TurboModule were detected in this NativeModule spec.`,
    );
  }
}
class MoreThanOneModuleInterfaceParserError extends ParserError {
  constructor(nativeModuleName, flowModuleInterfaces, names, language) {
    const finalName = names[names.length - 1];
    const allButLastName = names.slice(0, -1);
    const quote = x => `'${x}'`;
    const nameStr =
      allButLastName.map(quote).join(', ') + ', and ' + quote(finalName);
    super(
      nativeModuleName,
      flowModuleInterfaces,
      `Every NativeModule spec file must declare exactly one NativeModule ${language} interface. This file declares ${names.length}: ${nameStr}. Please remove the extraneous ${language} interface declarations.`,
    );
  }
}
class UnsupportedModulePropertyParserError extends ParserError {
  constructor(
    nativeModuleName,
    propertyValue,
    propertyName,
    invalidPropertyValueType,
    language,
  ) {
    super(
      nativeModuleName,
      propertyValue,
      `${language} interfaces extending TurboModule must only contain 'FunctionTypeAnnotation's. Property '${propertyName}' refers to a '${invalidPropertyValueType}'.`,
    );
  }
}
class UnsupportedTypeAnnotationParserError extends ParserError {
  constructor(nativeModuleName, typeAnnotation, language) {
    super(
      nativeModuleName,
      typeAnnotation,
      `${language} type annotation '${typeAnnotation.type}' is unsupported in NativeModule specs.`,
    );
    this.typeAnnotationType = typeAnnotation.type;
  }
}
class UnsupportedGenericParserError extends ParserError {
  // +genericName: string;
  constructor(nativeModuleName, genericTypeAnnotation, parser) {
    const genericName = parser.getTypeAnnotationName(genericTypeAnnotation);
    super(
      nativeModuleName,
      genericTypeAnnotation,
      `Unrecognized generic type '${genericName}' in NativeModule spec.`,
    );

    // this.genericName = genericName;
  }
}
class MissingTypeParameterGenericParserError extends ParserError {
  constructor(nativeModuleName, genericTypeAnnotation, parser) {
    const genericName = parser.getTypeAnnotationName(genericTypeAnnotation);
    super(
      nativeModuleName,
      genericTypeAnnotation,
      `Generic '${genericName}' must have type parameters.`,
    );
  }
}
class MoreThanOneTypeParameterGenericParserError extends ParserError {
  constructor(nativeModuleName, genericTypeAnnotation, parser) {
    const genericName = parser.getTypeAnnotationName(genericTypeAnnotation);
    super(
      nativeModuleName,
      genericTypeAnnotation,
      `Generic '${genericName}' must have exactly one type parameter.`,
    );
  }
}

/**
 * Array parsing errors
 */

class UnsupportedArrayElementTypeAnnotationParserError extends ParserError {
  constructor(
    nativeModuleName,
    arrayElementTypeAST,
    arrayType,
    invalidArrayElementType,
  ) {
    super(
      nativeModuleName,
      arrayElementTypeAST,
      `${arrayType} element types cannot be '${invalidArrayElementType}'.`,
    );
  }
}

/**
 * Object parsing errors
 */

class UnsupportedObjectPropertyTypeAnnotationParserError extends ParserError {
  constructor(nativeModuleName, propertyAST, invalidPropertyType, language) {
    let message = `'ObjectTypeAnnotation' cannot contain '${invalidPropertyType}'.`;
    if (
      invalidPropertyType === 'ObjectTypeSpreadProperty' &&
      language !== 'TypeScript'
    ) {
      message = "Object spread isn't supported in 'ObjectTypeAnnotation's.";
    }
    super(nativeModuleName, propertyAST, message);
  }
}
class UnsupportedObjectPropertyValueTypeAnnotationParserError extends ParserError {
  constructor(
    nativeModuleName,
    propertyValueAST,
    propertyName,
    invalidPropertyValueType,
  ) {
    super(
      nativeModuleName,
      propertyValueAST,
      `Object property '${propertyName}' cannot have type '${invalidPropertyValueType}'.`,
    );
  }
}

/**
 * Function parsing errors
 */

class UnnamedFunctionParamParserError extends ParserError {
  constructor(functionParam, nativeModuleName) {
    super(
      nativeModuleName,
      functionParam,
      'All function parameters must be named.',
    );
  }
}
class UnsupportedFunctionParamTypeAnnotationParserError extends ParserError {
  constructor(
    nativeModuleName,
    flowParamTypeAnnotation,
    paramName,
    invalidParamType,
  ) {
    super(
      nativeModuleName,
      flowParamTypeAnnotation,
      `Function parameter '${paramName}' cannot have type '${invalidParamType}'.`,
    );
  }
}
class UnsupportedFunctionReturnTypeAnnotationParserError extends ParserError {
  constructor(nativeModuleName, flowReturnTypeAnnotation, invalidReturnType) {
    super(
      nativeModuleName,
      flowReturnTypeAnnotation,
      `Function return cannot have type '${invalidReturnType}'.`,
    );
  }
}

/**
 * Enum parsing errors
 */

class UnsupportedEnumDeclarationParserError extends ParserError {
  constructor(nativeModuleName, arrayElementTypeAST, memberType) {
    super(
      nativeModuleName,
      arrayElementTypeAST,
      `Unexpected enum member type ${memberType}. Only string and number enum members are supported`,
    );
  }
}

/**
 * Union parsing errors
 */

class UnsupportedUnionTypeAnnotationParserError extends ParserError {
  constructor(nativeModuleName, arrayElementTypeAST, types) {
    super(
      nativeModuleName,
      arrayElementTypeAST,
      `Union members must be of the same type, but multiple types were found ${types.join(
        ', ',
      )}'.`,
    );
  }
}

/**
 * Module parsing errors
 */

class UnusedModuleInterfaceParserError extends ParserError {
  constructor(nativeModuleName, flowInterface) {
    super(
      nativeModuleName,
      flowInterface,
      "Unused NativeModule spec. Please load the NativeModule by calling TurboModuleRegistry.get<Spec>('<moduleName>').",
    );
  }
}
class MoreThanOneModuleRegistryCallsParserError extends ParserError {
  constructor(nativeModuleName, flowCallExpressions, numCalls) {
    super(
      nativeModuleName,
      flowCallExpressions,
      `Every NativeModule spec file must contain exactly one NativeModule load. This file contains ${numCalls}. Please simplify this spec file, splitting it as necessary, to remove the extraneous loads.`,
    );
  }
}
class UntypedModuleRegistryCallParserError extends ParserError {
  constructor(nativeModuleName, flowCallExpression, methodName, moduleName) {
    super(
      nativeModuleName,
      flowCallExpression,
      `Please type this NativeModule load: TurboModuleRegistry.${methodName}<Spec>('${moduleName}').`,
    );
  }
}
class IncorrectModuleRegistryCallTypeParameterParserError extends ParserError {
  constructor(nativeModuleName, flowTypeArguments, methodName, moduleName) {
    super(
      nativeModuleName,
      flowTypeArguments,
      `Please change these type arguments to reflect TurboModuleRegistry.${methodName}<Spec>('${moduleName}').`,
    );
  }
}
class IncorrectModuleRegistryCallArityParserError extends ParserError {
  constructor(
    nativeModuleName,
    flowCallExpression,
    methodName,
    incorrectArity,
  ) {
    super(
      nativeModuleName,
      flowCallExpression,
      `Please call TurboModuleRegistry.${methodName}<Spec>() with exactly one argument. Detected ${incorrectArity}.`,
    );
  }
}
class IncorrectModuleRegistryCallArgumentTypeParserError extends ParserError {
  constructor(nativeModuleName, flowArgument, methodName, type) {
    const a = /[aeiouy]/.test(type.toLowerCase()) ? 'an' : 'a';
    super(
      nativeModuleName,
      flowArgument,
      `Please call TurboModuleRegistry.${methodName}<Spec>() with a string literal. Detected ${a} '${type}'`,
    );
  }
}
module.exports = {
  ParserError,
  MissingTypeParameterGenericParserError,
  MoreThanOneTypeParameterGenericParserError,
  MisnamedModuleInterfaceParserError,
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleInterfaceParserError,
  UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedEnumDeclarationParserError,
  UnsupportedUnionTypeAnnotationParserError,
  UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError,
  UnusedModuleInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UntypedModuleRegistryCallParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError,
};
