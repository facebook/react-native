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
): FunctionTypeAnnotationParam {
  const type = param.typeAnnotation.type;
  const paramName = param.name.name;
  // TODO handle more types
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
function buildMethodSchema(property: MethodAST): MethodTypeShape {
  const name: string = property.key.name;
  const value = property.value;
  if (value.type !== 'FunctionTypeAnnotation') {
    throw new Error(
      `Only methods are supported as module properties. Found ${
        value.type
      } in ${property.key.name}`,
    );
  }

  const params = value.params.map(param =>
    getTypeAnnotationForParam(name, param),
  );

  const returnTypeAnnotation = getReturnTypeAnnotation(
    name,
    value.returnType.type,
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

function getMethods(
  typeDefinition: $ReadOnlyArray<MethodAST>,
): $ReadOnlyArray<MethodTypeShape> {
  return typeDefinition
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(buildMethodSchema)
    .filter(Boolean);
}

module.exports = {
  getMethods,
};
