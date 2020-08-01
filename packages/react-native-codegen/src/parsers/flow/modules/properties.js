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
  FunctionTypeAnnotationParamTypeAnnotation,
  ObjectParamTypeAnnotation,
  TypeAliasTypeAnnotation,
} from '../../../CodegenSchema.js';

import type {ASTNode, TypeMap} from '../utils.js';
const {getValueFromTypes} = require('../utils.js');

function getObjectProperties(
  name: string,
  objectParam: ASTNode,
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
  name: string,
  arrayParam: ASTNode,
  paramName: string,
  types: TypeMap,
):
  | FunctionTypeAnnotationParamTypeAnnotation
  | TypeAliasTypeAnnotation
  | typeof undefined {
  const typeAnnotation = getValueFromTypes(arrayParam, types);
  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'RootTag':
      return {
        type: 'ReservedFunctionValueTypeAnnotation',
        name: 'RootTag',
      };
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
          `Unsupported type for "${name}", param: "${paramName}": expected to find annotation for type of nested array contents`,
        );
      }
    case 'ObjectTypeAnnotation':
      if (arrayParam.id) {
        return {
          type: 'TypeAliasTypeAnnotation',
          name: arrayParam.id.name,
        };
      }
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
      // TODO T67565166: Generic objects are not type safe and should be disallowed in the schema.
      return {
        type: 'GenericObjectTypeAnnotation',
      };
  }
}

module.exports = {
  getElementTypeForArrayOrObject,
  getObjectProperties,
};
