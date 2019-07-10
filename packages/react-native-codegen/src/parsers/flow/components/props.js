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

import type {PropTypeShape} from '../../../CodegenSchema.js';

function getTypeAnnotationForArray(name, typeAnnotation, defaultValue) {
  if (typeAnnotation.type === 'NullableTypeAnnotation') {
    throw new Error(
      'Nested optionals such as "$ReadOnlyArray<?boolean>" are not supported, please declare optionals at the top level of value definitions as in "?$ReadOnlyArray<boolean>"',
    );
  }

  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'WithDefault'
  ) {
    throw new Error(
      'Nested defaults such as "$ReadOnlyArray<WithDefault<boolean, false>>" are not supported, please declare defaults at the top level of value definitions as in "WithDefault<$ReadOnlyArray<boolean>, false>"',
    );
  }

  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'ImageSource':
      return {
        type: 'NativePrimitiveTypeAnnotation',
        name: 'ImageSourcePrimitive',
      };
    case 'ColorValue':
      return {
        type: 'NativePrimitiveTypeAnnotation',
        name: 'ColorPrimitive',
      };
    case 'PointValue':
      return {
        type: 'NativePrimitiveTypeAnnotation',
        name: 'PointPrimitive',
      };
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
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
      };
    case 'StringTypeAnnotation':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'UnionTypeAnnotation':
      if (defaultValue == null) {
        throw new Error(`A default array enum value is required for "${name}"`);
      }
      return {
        type: 'StringEnumTypeAnnotation',
        default: defaultValue,
        options: typeAnnotation.types.map(option => ({name: option.value})),
      };
    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${name}"`);
  }
}

function getTypeAnnotation(name, typeAnnotation, defaultValue) {
  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === '$ReadOnlyArray'
  ) {
    return {
      type: 'ArrayTypeAnnotation',
      elementType: getTypeAnnotationForArray(
        name,
        typeAnnotation.typeParameters.params[0],
        defaultValue,
      ),
    };
  }

  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'ImageSource':
      return {
        type: 'NativePrimitiveTypeAnnotation',
        name: 'ImageSourcePrimitive',
      };
    case 'ColorValue':
      return {
        type: 'NativePrimitiveTypeAnnotation',
        name: 'ColorPrimitive',
      };
    case 'ColorArrayValue':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: {
          type: 'NativePrimitiveTypeAnnotation',
          name: 'ColorPrimitive',
        },
      };
    case 'PointValue':
      return {
        type: 'NativePrimitiveTypeAnnotation',
        name: 'PointPrimitive',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
        default: ((defaultValue ? defaultValue : 0): number),
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
        default: ((defaultValue ? defaultValue : 0): number),
      };
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
        default: ((defaultValue == null ? false : defaultValue): boolean),
      };
    case 'StringTypeAnnotation':
      if (typeof defaultValue !== 'undefined') {
        return {
          type: 'StringTypeAnnotation',
          default: (defaultValue: string | null),
        };
      }
      throw new Error(`A default string (or null) is required for "${name}"`);
    case 'Stringish':
      if (typeof defaultValue !== 'undefined') {
        return {
          type: 'StringTypeAnnotation',
          default: (defaultValue: string | null),
        };
      }
      throw new Error(`A default string (or null) is required for "${name}"`);
    case 'UnionTypeAnnotation':
      if (defaultValue !== null) {
        return {
          type: 'StringEnumTypeAnnotation',
          default: (defaultValue: string),
          options: typeAnnotation.types.map(option => ({name: option.value})),
        };
      }
      throw new Error(`A default enum value is required for "${name}"`);
    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${name}"`);
  }
}

function buildPropSchema(property): ?PropTypeShape {
  const name = property.key.name;

  const {value} = property;
  let typeAnnotation =
    value.type === 'NullableTypeAnnotation' ? value.typeAnnotation : value;

  const optional =
    value.type === 'NullableTypeAnnotation' ||
    property.optional ||
    (value.type === 'GenericTypeAnnotation' &&
      typeAnnotation.id.name === 'WithDefault');

  if (
    !property.optional &&
    value.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'WithDefault'
  ) {
    throw new Error(
      `key ${name} must be optional if used with WithDefault<> annotation`,
    );
  }
  if (
    value.type === 'NullableTypeAnnotation' &&
    (typeAnnotation.type === 'GenericTypeAnnotation' &&
      typeAnnotation.id.name === 'WithDefault')
  ) {
    throw new Error(
      'WithDefault<> is optional and does not need to be marked as optional. Please remove the ? annotation in front of it.',
    );
  }

  let type = typeAnnotation.type;
  if (
    type === 'GenericTypeAnnotation' &&
    (typeAnnotation.id.name === 'DirectEventHandler' ||
      typeAnnotation.id.name === 'BubblingEventHandler')
  ) {
    return null;
  }

  if (
    name === 'style' &&
    type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'ViewStyleProp'
  ) {
    return null;
  }

  let defaultValue = null;
  if (
    type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'WithDefault'
  ) {
    if (typeAnnotation.typeParameters.params.length === 1) {
      throw new Error(
        `WithDefault requires two parameters, did you forget to provide a default value for "${name}"?`,
      );
    }

    defaultValue = typeAnnotation.typeParameters.params[1].value;
    const defaultValueType = typeAnnotation.typeParameters.params[1].type;

    typeAnnotation = typeAnnotation.typeParameters.params[0];
    type =
      typeAnnotation.type === 'GenericTypeAnnotation'
        ? typeAnnotation.id.name
        : typeAnnotation.type;

    if (defaultValueType === 'NullLiteralTypeAnnotation') {
      if (type !== 'StringTypeAnnotation' && type !== 'Stringish') {
        throw new Error(
          `WithDefault can only provide a 'null' default value for string types (see ${name})`,
        );
      }

      defaultValue = null;
    }
  }

  return {
    name,
    optional,
    typeAnnotation: getTypeAnnotation(name, typeAnnotation, defaultValue),
  };
}

// $FlowFixMe there's no flowtype for ASTs
type PropAST = Object;

function getProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
): $ReadOnlyArray<PropTypeShape> {
  return typeDefinition
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(buildPropSchema)
    .filter(Boolean);
}

module.exports = {
  getProps,
};
