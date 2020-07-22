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
  NativeModuleMethodTypeShape,
  FunctionTypeAnnotationParam,
  FunctionTypeAnnotationReturn,
} from '../../../CodegenSchema.js';

import type {ASTNode, TypeMap} from '../utils.js';
const {getValueFromTypes} = require('../utils.js');
const {
  getElementTypeForArrayOrObject,
  getObjectProperties,
} = require('./properties');

// $FlowFixMe there's no flowtype for ASTs
type MethodAST = Object;

function getTypeAnnotationForParam(
  name: string,
  paramAnnotation: ASTNode,
  types: TypeMap,
): FunctionTypeAnnotationParam {
  let param = paramAnnotation;
  if (param.name === null) {
    throw new Error(
      `Unsupported type for ${name}. Please provide a name for every parameter.`,
    );
  }
  let paramName = param.name.name;
  let nullable = false;
  if (param.typeAnnotation.type === 'NullableTypeAnnotation') {
    nullable = true;
    param = paramAnnotation.typeAnnotation;
  }

  const typeAnnotation = getValueFromTypes(param.typeAnnotation, types);
  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'RootTag':
      return {
        name: paramName,
        nullable,
        typeAnnotation: {
          type: 'ReservedFunctionValueTypeAnnotation',
          name: 'RootTag',
        },
      };
    case 'Array':
    case '$ReadOnlyArray':
      if (
        typeAnnotation.typeParameters &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
          name: paramName,
          nullable,
          typeAnnotation: {
            type: 'ArrayTypeAnnotation',
            elementType: getElementTypeForArrayOrObject(
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
    case 'ObjectTypeAnnotation':
      if (param.typeAnnotation.type === 'GenericTypeAnnotation') {
        return {
          nullable,
          name: paramName,
          typeAnnotation: {
            type: 'TypeAliasTypeAnnotation',
            name: param.typeAnnotation.id.name,
          },
        };
      }
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type: 'ObjectTypeAnnotation',
          properties: getObjectProperties(
            name,
            typeAnnotation,
            paramName,
            types,
          ),
        },
      };
    case '$ReadOnly':
      if (
        typeAnnotation.typeParameters.params &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
          nullable,
          name: paramName,
          typeAnnotation: {
            type: 'ObjectTypeAnnotation',
            properties: getObjectProperties(
              name,
              typeAnnotation.typeParameters.params[0],
              paramName,
              types,
            ),
          },
        };
      } else {
        throw new Error(
          `Unsupported param for method "${name}", param "${paramName}". No type specified for $ReadOnly`,
        );
      }
    case 'FunctionTypeAnnotation':
      return {
        name: paramName,
        nullable,
        typeAnnotation: {
          type: 'FunctionTypeAnnotation',
        },
      };
    case 'NumberTypeAnnotation':
    case 'BooleanTypeAnnotation':
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type,
        },
      };

    case 'StringTypeAnnotation':
    case 'Stringish':
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };
    case 'Int32':
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type: 'Int32TypeAnnotation',
        },
      };
    case 'Float':
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type: 'FloatTypeAnnotation',
        },
      };
    default:
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type: 'GenericObjectTypeAnnotation',
        },
      };
  }
}

function getReturnTypeAnnotation(
  methodName: string,
  returnType,
  types: TypeMap,
): FunctionTypeAnnotationReturn {
  let typeAnnotation = getValueFromTypes(returnType, types);
  let nullable = false;
  if (typeAnnotation.type === 'NullableTypeAnnotation') {
    nullable = true;
    typeAnnotation = typeAnnotation.typeAnnotation;
  }
  let type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'RootTag':
      return {
        nullable,
        type: 'ReservedFunctionValueTypeAnnotation',
        name: 'RootTag',
      };
    case 'Promise':
      if (
        typeAnnotation.typeParameters &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
          type: 'GenericPromiseTypeAnnotation',
          nullable,
        };
      } else {
        throw new Error(
          `Unsupported return promise type for ${methodName}: expected to find annotation for type of promise content`,
        );
      }
    case 'Array':
    case '$ReadOnlyArray':
      if (
        typeAnnotation.typeParameters &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
          nullable,
          type: 'ArrayTypeAnnotation',
          elementType: getElementTypeForArrayOrObject(
            methodName,
            typeAnnotation.typeParameters.params[0],
            'returning value',
            types,
          ),
        };
      } else {
        throw new Error(
          `Unsupported return type for ${methodName}: expected to find annotation for type of array contents`,
        );
      }
    case 'ObjectTypeAnnotation':
      return {
        nullable,
        type: 'ObjectTypeAnnotation',
        properties: getObjectProperties(
          methodName,
          typeAnnotation,
          'returning value',
          types,
        ),
      };
    case '$ReadOnly':
      if (
        typeAnnotation.typeParameters.params &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
          nullable,
          type: 'ObjectTypeAnnotation',
          properties: getObjectProperties(
            methodName,
            typeAnnotation.typeParameters.params[0],
            'returning value',
            types,
          ),
        };
      } else {
        throw new Error(
          `Unsupported return type for method "${methodName}", No type specified for $ReadOnly`,
        );
      }
    case 'BooleanTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'VoidTypeAnnotation':
      return {
        nullable,
        type,
      };
    case 'StringTypeAnnotation':
    case 'Stringish':
      return {
        nullable,
        type: 'StringTypeAnnotation',
      };

    case 'Int32':
      return {
        nullable,
        type: 'Int32TypeAnnotation',
      };
    case 'Float':
      return {
        nullable,
        type: 'FloatTypeAnnotation',
      };
    default:
      return {
        type: 'GenericObjectTypeAnnotation',
        nullable,
      };
  }
}

function buildMethodSchema(
  property: MethodAST,
  types: TypeMap,
): NativeModuleMethodTypeShape {
  const name: string = property.key.name;
  const value = getValueFromTypes(property.value, types);
  if (value.type !== 'FunctionTypeAnnotation') {
    throw new Error(
      `Only methods are supported as module properties. Found ${value.type} in ${property.key.name}`,
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
      optional: property.optional,
    },
  };
}

function getMethods(
  typeDefinition: $ReadOnlyArray<MethodAST>,
  types: TypeMap,
): $ReadOnlyArray<NativeModuleMethodTypeShape> {
  return typeDefinition
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildMethodSchema(property, types))
    .filter(Boolean);
}

module.exports = {
  getMethods,
};
