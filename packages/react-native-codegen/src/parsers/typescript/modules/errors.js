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

const invariant = require('invariant');
const {ParserError} = require('../errors');

class MisnamedModuleTypeScriptInterfaceParserError extends ParserError {
  constructor(hasteModuleName: string, id: $FlowFixMe) {
    super(
      hasteModuleName,
      id,
      `All TypeScript interfaces extending TurboModule must be called 'Spec'. Please rename TypeScript interface '${id.name}' to 'Spec'.`,
    );
  }
}

class ModuleTypeScriptInterfaceNotFoundParserError extends ParserError {
  constructor(hasteModuleName: string, ast: $FlowFixMe) {
    super(
      hasteModuleName,
      ast,
      'No TypeScript interfaces extending TurboModule were detected in this NativeModule spec.',
    );
  }
}

class MoreThanOneModuleTypeScriptInterfaceParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    flowModuleInterfaces: $ReadOnlyArray<$FlowFixMe>,
    names: $ReadOnlyArray<string>,
  ) {
    const finalName = names[names.length - 1];
    const allButLastName = names.slice(0, -1);
    const quote = (x: string) => `'${x}'`;

    const nameStr =
      allButLastName.map(quote).join(', ') + ', and ' + quote(finalName);

    super(
      hasteModuleName,
      flowModuleInterfaces,
      `Every NativeModule spec file must declare exactly one NativeModule TypeScript interface. This file declares ${names.length}: ${nameStr}. Please remove the extraneous TypeScript interface declarations.`,
    );
  }
}

class UnsupportedModulePropertyParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    propertyValue: $FlowFixMe,
    propertyName: string,
    invalidPropertyValueType: string,
  ) {
    super(
      hasteModuleName,
      propertyValue,
      `TypeScript interfaces extending TurboModule must only contain 'FunctionTypeAnnotation's. Property '${propertyName}' refers to a '${invalidPropertyValueType}'.`,
    );
  }
}

class UnsupportedTypeScriptTypeAnnotationParserError extends ParserError {
  +typeAnnotationType: string;
  constructor(hasteModuleName: string, typeAnnotation: $FlowFixMe) {
    super(
      hasteModuleName,
      typeAnnotation,
      `TypeScript type annotation '${typeAnnotation.type}' is unsupported in NativeModule specs.`,
    );

    this.typeAnnotationType = typeAnnotation.type;
  }
}

class UnsupportedTypeScriptGenericParserError extends ParserError {
  +genericName: string;
  constructor(hasteModuleName: string, genericTypeAnnotation: $FlowFixMe) {
    const genericName = genericTypeAnnotation.typeName.name;
    super(
      hasteModuleName,
      genericTypeAnnotation,
      `Unrecognized generic type '${genericName}' in NativeModule spec.`,
    );

    this.genericName = genericName;
  }
}

class IncorrectlyParameterizedTypeScriptGenericParserError extends ParserError {
  +genericName: string;
  +numTypeParameters: number;

  constructor(hasteModuleName: string, genericTypeAnnotation: $FlowFixMe) {
    if (genericTypeAnnotation.typeParameters == null) {
      super(
        hasteModuleName,
        genericTypeAnnotation,
        `Generic '${genericTypeAnnotation.typeName.name}' must have type parameters.`,
      );
      return;
    }

    if (
      genericTypeAnnotation.typeParameters.type ===
        'TypeParameterInstantiation' &&
      genericTypeAnnotation.typeParameters.params.length !== 1
    ) {
      super(
        hasteModuleName,
        genericTypeAnnotation.typeParameters,
        `Generic '${genericTypeAnnotation.typeName.name}' must have exactly one type parameter.`,
      );
      return;
    }

    invariant(
      false,
      "Couldn't create IncorrectlyParameterizedFlowGenericParserError",
    );
  }
}

/**
 * Array parsing errors
 */

class UnsupportedArrayElementTypeAnnotationParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    arrayElementTypeAST: $FlowFixMe,
    arrayType: 'Array' | 'ReadonlyArray',
    invalidArrayElementType: string,
  ) {
    super(
      hasteModuleName,
      arrayElementTypeAST,
      `${arrayType} element types cannot be '${invalidArrayElementType}'.`,
    );
  }
}

/**
 * Object parsing errors
 */

class UnsupportedObjectPropertyTypeAnnotationParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    propertyAST: $FlowFixMe,
    invalidPropertyType: string,
  ) {
    let message = `'ObjectTypeAnnotation' cannot contain '${invalidPropertyType}'.`;

    super(hasteModuleName, propertyAST, message);
  }
}

class UnsupportedObjectPropertyValueTypeAnnotationParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    propertyValueAST: $FlowFixMe,
    propertyName: string,
    invalidPropertyValueType: string,
  ) {
    super(
      hasteModuleName,
      propertyValueAST,
      `Object property '${propertyName}' cannot have type '${invalidPropertyValueType}'.`,
    );
  }
}

/**
 * Function parsing errors
 */

class UnnamedFunctionParamParserError extends ParserError {
  constructor(functionParam: $FlowFixMe, hasteModuleName: string) {
    super(
      hasteModuleName,
      functionParam,
      'All function parameters must be named.',
    );
  }
}

class UnsupportedFunctionParamTypeAnnotationParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    flowParamTypeAnnotation: $FlowFixMe,
    paramName: string,
    invalidParamType: string,
  ) {
    super(
      hasteModuleName,
      flowParamTypeAnnotation,
      `Function parameter '${paramName}' cannot have type '${invalidParamType}'.`,
    );
  }
}

class UnsupportedFunctionReturnTypeAnnotationParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    flowReturnTypeAnnotation: $FlowFixMe,
    invalidReturnType: string,
  ) {
    super(
      hasteModuleName,
      flowReturnTypeAnnotation,
      `Function return cannot have type '${invalidReturnType}'.`,
    );
  }
}

class UnusedModuleTypeScriptInterfaceParserError extends ParserError {
  constructor(hasteModuleName: string, flowInterface: $FlowFixMe) {
    super(
      hasteModuleName,
      flowInterface,
      "Unused NativeModule spec. Please load the NativeModule by calling TurboModuleRegistry.get<Spec>('<moduleName>').",
    );
  }
}

class MoreThanOneModuleRegistryCallsParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    flowCallExpressions: $FlowFixMe,
    numCalls: number,
  ) {
    super(
      hasteModuleName,
      flowCallExpressions,
      `Every NativeModule spec file must contain exactly one NativeModule load. This file contains ${numCalls}. Please simplify this spec file, splitting it as necessary, to remove the extraneous loads.`,
    );
  }
}

class UntypedModuleRegistryCallParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    flowCallExpression: $FlowFixMe,
    methodName: string,
    moduleName: string,
  ) {
    super(
      hasteModuleName,
      flowCallExpression,
      `Please type this NativeModule load: TurboModuleRegistry.${methodName}<Spec>('${moduleName}').`,
    );
  }
}

class IncorrectModuleRegistryCallTypeParameterParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    flowTypeArguments: $FlowFixMe,
    methodName: string,
    moduleName: string,
  ) {
    super(
      hasteModuleName,
      flowTypeArguments,
      `Please change these type arguments to reflect TurboModuleRegistry.${methodName}<Spec>('${moduleName}').`,
    );
  }
}

class IncorrectModuleRegistryCallArityParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    flowCallExpression: $FlowFixMe,
    methodName: string,
    incorrectArity: number,
  ) {
    super(
      hasteModuleName,
      flowCallExpression,
      `Please call TurboModuleRegistry.${methodName}<Spec>() with exactly one argument. Detected ${incorrectArity}.`,
    );
  }
}

class IncorrectModuleRegistryCallArgumentTypeParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    flowArgument: $FlowFixMe,
    methodName: string,
    type: string,
  ) {
    const a = /[aeiouy]/.test(type.toLowerCase()) ? 'an' : 'a';
    super(
      hasteModuleName,
      flowArgument,
      `Please call TurboModuleRegistry.${methodName}<Spec>() with a string literal. Detected ${a} '${type}'`,
    );
  }
}

module.exports = {
  IncorrectlyParameterizedTypeScriptGenericParserError,
  MisnamedModuleTypeScriptInterfaceParserError,
  ModuleTypeScriptInterfaceNotFoundParserError,
  MoreThanOneModuleTypeScriptInterfaceParserError,
  UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedTypeScriptGenericParserError,
  UnsupportedTypeScriptTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError,
  UnusedModuleTypeScriptInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UntypedModuleRegistryCallParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError,
};
