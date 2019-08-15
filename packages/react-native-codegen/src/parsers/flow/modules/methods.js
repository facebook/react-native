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

import type {TypeMap} from '../utils.js';
const {getValueFromTypes} = require('../utils.js');

// $FlowFixMe there's no flowtype for ASTs
type MethodAST = Object;

function getObjectProperties(
  name: string,
  objectParam,
  paramName: string,
  types: TypeMap,
): $ReadOnlyArray<ObjectParamTypeAnnotation> {
  return objectParam.properties.map(objectTypeProperty => {
    let optional = objectTypeProperty.optional;
    let value = objectTypeProperty.value;
    if (value.type === 'NullableTypeAnnotation') {
      if (
        objectTypeProperty.value.typeAnnotation.type !== 'StringTypeAnnotation'
      ) {
        optional = true;
      }
      value = objectTypeProperty.value.typeAnnotation;
    }
    return {
      optional,
      name: objectTypeProperty.key.name,
      typeAnnotation: getElementTypeForArrayOrObject(
        name,
        value,
        paramName,
        types,
      ),
    };
  });
}

function getElementTypeForArrayOrObject(
  name,
  arrayParam,
  paramName,
  types: TypeMap,
): FunctionTypeAnnotationParamTypeAnnotation | typeof undefined {
  const typeAnnotation = getValueFromTypes(arrayParam, types);
  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'Array':
    case '$ReadOnlyArray':
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
    case 'ObjectTypeAnnotation':
      return {
        type: 'ObjectTypeAnnotation',
        properties: getObjectProperties(name, typeAnnotation, paramName, types),
      };
    case '$ReadOnly':
      if (
        typeAnnotation.typeParameters.params &&
        typeAnnotation.typeParameters.params[0]
      ) {
        return {
          type: 'ObjectTypeAnnotation',
          properties: getObjectProperties(
            name,
            typeAnnotation.typeParameters.params[0],
            paramName,
            types,
          ),
        };
      } else {
        throw new Error(
          `Unsupported param for method "${name}", param "${paramName}". No type specified for $ReadOnly`,
        );
      }
    case 'AnyTypeAnnotation':
      return {
        type,
      };
    case 'NumberTypeAnnotation':
    case 'BooleanTypeAnnotation':
      return {
        type,
      };
    case 'StringTypeAnnotation':
    case 'Stringish':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
      };
    case 'TupleTypeAnnotation':
    case 'UnionTypeAnnotation':
      return undefined;
    default:
      return {
        type: 'GenericObjectTypeAnnotation',
      };
  }
}

function getTypeAnnotationForParam(
  name: string,
  paramAnnotation,
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
