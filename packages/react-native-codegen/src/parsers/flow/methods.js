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
  FunctionTypeAnnotationParamTypeAnnotation,
  FunctionTypeAnnotationReturn,
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
): FunctionTypeAnnotationParamTypeAnnotation {
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

function getTypeAnnotationForParam(
  name: string,
  param,
  types: $ReadOnlyArray<TypesAST>,
): FunctionTypeAnnotationParam {
  const type = getValueFromTypes(param.typeAnnotation, types).type;
  const paramName = param.name.name;
  const typeAnnotation = wrapPrimitiveIntoTypeAnnotation(name, type, paramName);
  return {
    name: paramName,
    typeAnnotation,
  };
}
function getReturnTypeAnnotation(
  methodName: string,
  type,
): FunctionTypeAnnotationReturn {
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
    getValueFromTypes(value.returnType, types).type,
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
