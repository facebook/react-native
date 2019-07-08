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
  ObjectParamTypeAnnotation,
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

function getObjectProperties(
  name: string,
  objectParam,
  paramName: string,
  types: $ReadOnlyArray<TypesAST>,
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
  }
  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'Object'
  ) {
    return {
      type: 'ObjectWithoutPropertiesTypeAnnotation',
    };
  }

  if (typeAnnotation.type === 'ObjectTypeAnnotation') {
    return {
      type: 'ObjectTypeAnnotation',
      properties: getObjectProperties(name, arrayParam, paramName, types),
    };
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
  paramAnnotation,
  types: $ReadOnlyArray<TypesAST>,
): FunctionTypeAnnotationParam {
  let param = paramAnnotation;
  let paramName = param.name.name;
  let nullable = false;
  if (param.typeAnnotation.type === 'NullableTypeAnnotation') {
    nullable = true;
    param = paramAnnotation.typeAnnotation;
  }

  const typeAnnotation = getValueFromTypes(param.typeAnnotation, types);
  if (
    param.typeAnnotation.type === 'GenericTypeAnnotation' &&
    param.typeAnnotation.id.name === 'Object'
  ) {
    return {
      nullable,
      name: paramName,
      typeAnnotation: {
        type: 'ObjectWithoutPropertiesTypeAnnotation',
      },
    };
  }
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
  }
  if (param.typeAnnotation.type === 'ObjectTypeAnnotation') {
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
  }
  const type = typeAnnotation.type;

  if (
    nullable &&
    (type === 'NumberTypeAnnotation' || type === 'BooleanTypeAnnotation')
  ) {
    throw new Error(
      `Booleans and numbers cannot be nullable for param "${paramName} in method "${name}".`,
    );
  }
  return {
    nullable,
    name: paramName,
    typeAnnotation: wrapPrimitiveIntoTypeAnnotation(name, type, paramName),
  };
}

function getReturnTypeAnnotation(
  methodName: string,
  returnType,
  types: $ReadOnlyArray<TypesAST>,
): FunctionTypeAnnotationReturn {
  const typeAnnotation = getValueFromTypes(returnType, types);
  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'Object'
  ) {
    return {
      type: 'ObjectWithoutPropertiesTypeAnnotation',
    };
  }
  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'Promise'
  ) {
    if (
      typeAnnotation.typeParameters &&
      typeAnnotation.typeParameters.params[0]
    ) {
      return {
        type: 'PromiseTypeAnnotation',
        resolvingType: getReturnTypeAnnotation(
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
  }
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
  }

  if (returnType.type === 'ObjectTypeAnnotation') {
    return {
      type: 'ObjectTypeAnnotation',
      properties: getObjectProperties(
        methodName,
        returnType,
        'returning value',
        types,
      ),
    };
  }
  const type = typeAnnotation.type;
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
      optional: property.optional,
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
