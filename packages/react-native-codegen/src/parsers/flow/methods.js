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

import type {
  MethodTypeShape,
  FunctionTypeAnnotationParam,
  FunctionTypeAnnotationReturn,
  PrimitiveTypeAnnotation,
  FunctionTypeAnnotationParamTypeAnnotation,
} from '../../CodegenSchema.js';

function getValueFromTypes(value, types) {
  if (value.type === 'GenericTypeAnnotation' && types[value.id.name]) {
    return getValueFromTypes(types[value.id.name].right, types);
  }
  return value;
}

function wrapPrimitiveIntoTypeAnnotation(
  methodName: string,
  type:
    | 'BooleanTypeAnnotation'
    | 'NumberTypeAnnotation'
    | 'StringTypeAnnotation',
  paramName: string,
): PrimitiveTypeAnnotation {
  switch (type) {
    case 'BooleanTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'StringTypeAnnotation':
      return {
        type,
      };
    default:
      (type: empty);
      throw new Error(
        `Unsupported param type for method "${methodName}", param "${paramName}". Found ${type}`,
      );
  }
}

function getElementTypeForArray(
  name,
  arrayParam,
  paramName,
  types: $ReadOnlyArray<TypesAST>,
): FunctionTypeAnnotationParamTypeAnnotation {
  const typeAnnotation = getValueFromTypes(arrayParam, types);
  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'Array'
  ) {
    if (
      typeAnnotation.typeParameters &&
      typeAnnotation.typeParameters.params[0]
    ) {
      return {
        type: 'ArrayTypeAnnotation',
        elementType: getElementTypeForArray(
          name,
          typeAnnotation.typeParameters.params[0],
          'returning value',
          types,
        ),
      };
    } else {
      throw new Error(
        `Unsupported type for ${name}, param: "${paramName}": expected to find annotation for type of nested array contents`,
      );
    }
  }
  const type = typeAnnotation.type;
  if (type === 'AnyTypeAnnotation') {
    return {
      type,
    };
  }
  return wrapPrimitiveIntoTypeAnnotation(name, type, paramName);
}

function getTypeAnnotationForParam(
  name: string,
  param,
  types: $ReadOnlyArray<TypesAST>,
): FunctionTypeAnnotationParam {
  const typeAnnotation = getValueFromTypes(param.typeAnnotation, types);
  const paramName = param.name.name;
  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'Array'
  ) {
    if (
      typeAnnotation.typeParameters &&
      typeAnnotation.typeParameters.params[0]
    ) {
      return {
        name: paramName,
        typeAnnotation: {
          type: 'ArrayTypeAnnotation',
          elementType: getElementTypeForArray(
            name,
            typeAnnotation.typeParameters.params[0],
            paramName,
            types,
          ),
        },
      };
    } else {
      throw new Error(
        `Unsupported type for ${name}, param: "${paramName}": expected to find annotation for type of array contents`,
      );
    }
  }
  const type = typeAnnotation.type;
  return {
    name: paramName,
    typeAnnotation: wrapPrimitiveIntoTypeAnnotation(name, type, paramName),
  };
}
function getReturnTypeAnnotation(
  methodName: string,
  returnType,
  types: $ReadOnlyArray<TypesAST>,
): FunctionTypeAnnotationReturn {
  if (
    returnType.type === 'GenericTypeAnnotation' &&
    returnType.id.name === 'Array'
  ) {
    if (returnType.typeParameters && returnType.typeParameters.params[0]) {
      return {
        type: 'ArrayTypeAnnotation',
        elementType: getElementTypeForArray(
          methodName,
          returnType.typeParameters.params[0],
          'returning value',
          types,
        ),
      };
    } else {
      throw new Error(
        `Unsupported return type for ${methodName}: expected to find annotation for type of array contents`,
      );
    }
  }
  const type = returnType.type;
  switch (type) {
    case 'BooleanTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'VoidTypeAnnotation':
      return {
        type,
      };
    default:
      (type: empty);
      throw new Error(
        `Unsupported return type for method "${methodName}", Found ${type}`,
      );
  }
}

function buildMethodSchema(
  property: MethodAST,
  types: $ReadOnlyArray<TypesAST>,
): MethodTypeShape {
  const name: string = property.key.name;
  const value = getValueFromTypes(property.value, types);
  if (value.type !== 'FunctionTypeAnnotation') {
    throw new Error(
      `Only methods are supported as module properties. Found ${
        value.type
      } in ${property.key.name}`,
    );
  }
  const params = value.params.map(param =>
    getTypeAnnotationForParam(name, param, types),
  );

  const returnTypeAnnotation = getReturnTypeAnnotation(
    name,
    getValueFromTypes(value.returnType, types),
    types,
  );
  return {
    name,
    typeAnnotation: {
      type: 'FunctionTypeAnnotation',
      returnTypeAnnotation,
      params,
    },
  };
}

// $FlowFixMe there's no flowtype for ASTs
type MethodAST = Object;
// $FlowFixMe there's no flowtype for ASTs
type TypesAST = Object;

function getMethods(
  typeDefinition: $ReadOnlyArray<MethodAST>,
  types: $ReadOnlyArray<TypesAST>,
): $ReadOnlyArray<MethodTypeShape> {
  return typeDefinition
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildMethodSchema(property, types))
    .filter(Boolean);
}

module.exports = {
  getMethods,
};
