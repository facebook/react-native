/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

class MisnamedModuleFlowInterfaceParserError extends ParserError {
  constructor(hasteModuleName: string, id: $FlowFixMe) {
    super(
      hasteModuleName,
      id,
      `All Flow interfaces extending TurboModule must be called 'Spec'. Please rename Flow interface '${id.name}' to 'Spec'.`,
    );
  }
}

class ModuleFlowInterfaceNotParserError extends ParserError {
  constructor(hasteModuleName: string, ast: $FlowFixMe) {
    super(
      hasteModuleName,
      ast,
      `Module ${hasteModuleName}: No Flow interfaces extending TurboModule were detected in this NativeModule spec.`,
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
      `Flow interfaces extending TurboModule must only contain 'FunctionTypeAnnotation's. Property '${propertyName}' refers to a '${invalidPropertyValueType}'.`,
    );
  }
}

class UnsupportedFlowTypeAnnotationParserError extends ParserError {
  +typeAnnotationType: string;
  constructor(hasteModuleName: string, typeAnnotation: $FlowFixMe) {
    super(
      hasteModuleName,
      typeAnnotation,
      `Flow type annotation '${typeAnnotation.type}' is unsupported in NativeModule specs.`,
    );

    this.typeAnnotationType = typeAnnotation.type;
  }
}

class UnsupportedFlowGenericParserError extends ParserError {
  +genericName: string;
  constructor(hasteModuleName: string, genericTypeAnnotation: $FlowFixMe) {
    const genericName = genericTypeAnnotation.id.name;
    super(
      hasteModuleName,
      genericTypeAnnotation,
      `Unrecognized generic type '${genericName}' in NativeModule spec.`,
    );

    this.genericName = genericName;
  }
}

class IncorrectlyParameterizedFlowGenericParserError extends ParserError {
  +genericName: string;
  +numTypeParameters: number;

  constructor(hasteModuleName: string, genericTypeAnnotation: $FlowFixMe) {
    if (genericTypeAnnotation.typeParameters == null) {
      super(
        hasteModuleName,
        genericTypeAnnotation,
        `Generic '${genericTypeAnnotation.id.name}' must have type parameters.`,
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
        `Generic '${genericTypeAnnotation.id.name}' must have exactly one type parameter.`,
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
    arrayType: 'Array' | '$ReadOnlyArray',
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

    if (invalidPropertyType === 'ObjectTypeSpreadProperty') {
      message = "Object spread isn't supported in 'ObjectTypeAnnotation's.";
    }

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

module.exports = {
  IncorrectlyParameterizedFlowGenericParserError,
  MisnamedModuleFlowInterfaceParserError,
  ModuleFlowInterfaceNotParserError,
  UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedFlowGenericParserError,
  UnsupportedFlowTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError,
};
