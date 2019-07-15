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
  FunctionTypeAnnotationParamTypeAnnotation,
  ObjectParamTypeAnnotation,
} from '../../../CodegenSchema.js';

// $FlowFixMe there's no flowtype for ASTs
type MethodAST = Object;
// $FlowFixMe there's no flowtype for ASTs
type TypeMap = $ReadOnly<{|[name: string]: Object|}>;

function getValueFromTypes(value, types) {
  if (value.type === 'GenericTypeAnnotation' && types[value.id.name]) {
    return getValueFromTypes(types[value.id.name].right, types);
  }
  return value;
}

function getObjectProperties(
  name: string,
  objectParam,
  paramName: string,
  types: TypeMap,
): $ReadOnlyArray<ObjectParamTypeAnnotation> {
  return objectParam.properties.map(objectTypeProperty => ({
    name: objectTypeProperty.key.name,
    typeAnnotation: getElementTypeForArrayOrObject(
      name,
      objectTypeProperty.value,
      paramName,
      types,
    ),
  }));
}

function getElementTypeForArrayOrObject(
  name,
  arrayParam,
  paramName,
  types: TypeMap,
): FunctionTypeAnnotationParamTypeAnnotation {
  const typeAnnotation = getValueFromTypes(arrayParam, types);
  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'Array':
      if (
        typeAnnotation.typeParameters &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
          type: 'ArrayTypeAnnotation',
          elementType: getElementTypeForArrayOrObject(
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
    case 'Object':
      return {
        type: 'GenericObjectTypeAnnotation',
      };
    case 'ObjectTypeAnnotation':
      return {
        type: 'ObjectTypeAnnotation',
        properties: getObjectProperties(name, arrayParam, paramName, types),
      };
    case 'AnyTypeAnnotation':
      return {
        type,
      };
    case 'NumberTypeAnnotation':
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
      return {
        type,
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
      };
    default:
      throw new Error(
        `Unsupported param type for method "${name}", param "${paramName}". Found ${type}`,
      );
  }
}

function getTypeAnnotationForParam(
  name: string,
  paramAnnotation,
  types: TypeMap,
): FunctionTypeAnnotationParam {
  let param = paramAnnotation;
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
    case 'Object':
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type: 'GenericObjectTypeAnnotation',
        },
      };
    case 'Array':
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
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type: 'ObjectTypeAnnotation',
          properties: getObjectProperties(
            name,
            param.typeAnnotation,
            paramName,
            types,
          ),
        },
      };
    case 'FunctionTypeAnnotation':
      const params = typeAnnotation.params.map(callbackParam =>
        getTypeAnnotationForParam(name, callbackParam, types),
      );
      const returnTypeAnnotation = getReturnTypeAnnotation(
        name,
        typeAnnotation.returnType,
        types,
      );
      return {
        name: paramName,
        nullable,
        typeAnnotation: {
          type: 'FunctionTypeAnnotation',
          params,
          returnTypeAnnotation,
        },
      };
    case 'NumberTypeAnnotation':
    case 'BooleanTypeAnnotation':
      if (nullable) {
        throw new Error(
          `Booleans and numbers cannot be nullable for param "${paramName} in method "${name}".`,
        );
      }
    // eslint-disable no-fallthrough
    case 'StringTypeAnnotation':
      return {
        nullable,
        name: paramName,
        typeAnnotation: {
          type,
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
      throw new Error(
        `Unsupported param type for method "${name}", param "${paramName}". Found ${type}`,
      );
  }
}

function getReturnTypeAnnotation(
  methodName: string,
  returnType,
  types: TypeMap,
): FunctionTypeAnnotationReturn {
  const typeAnnotation = getValueFromTypes(returnType, types);
  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'Object':
      return {
        type: 'GenericObjectTypeAnnotation',
      };
    case 'Promise':
      if (
        typeAnnotation.typeParameters &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
          type: 'GenericPromiseTypeAnnotation',
          resolvedType: getReturnTypeAnnotation(
            methodName,
            typeAnnotation.typeParameters.params[0],
            types,
          ),
        };
      } else {
        throw new Error(
          `Unsupported return promise type for ${methodName}: expected to find annotation for type of promise content`,
        );
      }
    case 'Array':
      if (
        typeAnnotation.typeParameters &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
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
        type: 'ObjectTypeAnnotation',
        properties: getObjectProperties(
          methodName,
          returnType,
          'returning value',
          types,
        ),
      };

    case 'BooleanTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'VoidTypeAnnotation':
      return {
        type,
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
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
  types: TypeMap,
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
      optional: property.optional,
    },
  };
}

function getMethods(
  typeDefinition: $ReadOnlyArray<MethodAST>,
  types: TypeMap,
): $ReadOnlyArray<MethodTypeShape> {
  return typeDefinition
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildMethodSchema(property, types))
    .filter(Boolean);
}

module.exports = {
  getMethods,
};
