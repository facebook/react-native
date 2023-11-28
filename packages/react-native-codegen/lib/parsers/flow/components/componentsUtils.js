/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const _require = require('../utils.js'),
  getValueFromTypes = _require.getValueFromTypes;
const _require2 = require('../../parsers-commons'),
  verifyPropNotAlreadyDefined = _require2.verifyPropNotAlreadyDefined;
// $FlowFixMe[unsupported-variance-annotation]
function getTypeAnnotationForArray(
  name,
  typeAnnotation,
  defaultValue,
  types,
  parser,
  buildSchema,
) {
  const extractedTypeAnnotation = getValueFromTypes(typeAnnotation, types);
  if (extractedTypeAnnotation.type === 'NullableTypeAnnotation') {
    throw new Error(
      'Nested optionals such as "$ReadOnlyArray<?boolean>" are not supported, please declare optionals at the top level of value definitions as in "?$ReadOnlyArray<boolean>"',
    );
  }
  if (
    extractedTypeAnnotation.type === 'GenericTypeAnnotation' &&
    parser.getTypeAnnotationName(extractedTypeAnnotation) === 'WithDefault'
  ) {
    throw new Error(
      'Nested defaults such as "$ReadOnlyArray<WithDefault<boolean, false>>" are not supported, please declare defaults at the top level of value definitions as in "WithDefault<$ReadOnlyArray<boolean>, false>"',
    );
  }
  if (extractedTypeAnnotation.type === 'GenericTypeAnnotation') {
    // Resolve the type alias if it's not defined inline
    const objectType = getValueFromTypes(extractedTypeAnnotation, types);
    if (objectType.id.name === '$ReadOnly') {
      return {
        type: 'ObjectTypeAnnotation',
        properties: flattenProperties(
          objectType.typeParameters.params[0].properties,
          types,
          parser,
        )
          .map(prop => buildSchema(prop, types, parser))
          .filter(Boolean),
      };
    }
    if (objectType.id.name === '$ReadOnlyArray') {
      // We need to go yet another level deeper to resolve
      // types that may be defined in a type alias
      const nestedObjectType = getValueFromTypes(
        objectType.typeParameters.params[0],
        types,
      );
      return {
        type: 'ArrayTypeAnnotation',
        elementType: {
          type: 'ObjectTypeAnnotation',
          properties: flattenProperties(
            nestedObjectType.typeParameters.params[0].properties,
            types,
            parser,
          )
            .map(prop => buildSchema(prop, types, parser))
            .filter(Boolean),
        },
      };
    }
  }
  const type =
    extractedTypeAnnotation.type === 'GenericTypeAnnotation'
      ? parser.getTypeAnnotationName(extractedTypeAnnotation)
      : extractedTypeAnnotation.type;
  switch (type) {
    case 'ImageSource':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageSourcePrimitive',
      };
    case 'ImageRequest':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageRequestPrimitive',
      };
    case 'ColorValue':
    case 'ProcessedColorValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ColorPrimitive',
      };
    case 'PointValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'PointPrimitive',
      };
    case 'EdgeInsetsValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'EdgeInsetsPrimitive',
      };
    case 'DimensionValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'DimensionPrimitive',
      };
    case 'Stringish':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
      };
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
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
      typeAnnotation.types.reduce((lastType, currType) => {
        if (lastType && currType.type !== lastType.type) {
          throw new Error(`Mixed types are not supported (see "${name}")`);
        }
        return currType;
      });
      if (defaultValue === null) {
        throw new Error(`A default enum value is required for "${name}"`);
      }
      const unionType = typeAnnotation.types[0].type;
      if (unionType === 'StringLiteralTypeAnnotation') {
        return {
          type: 'StringEnumTypeAnnotation',
          default: defaultValue,
          options: typeAnnotation.types.map(option => option.value),
        };
      } else if (unionType === 'NumberLiteralTypeAnnotation') {
        throw new Error(
          `Arrays of int enums are not supported (see: "${name}")`,
        );
      } else {
        throw new Error(
          `Unsupported union type for "${name}", received "${unionType}"`,
        );
      }
    default:
      throw new Error(`Unknown property type for "${name}": ${type}`);
  }
}
function flattenProperties(typeDefinition, types, parser) {
  return typeDefinition
    .map(property => {
      if (property.type === 'ObjectTypeProperty') {
        return property;
      } else if (property.type === 'ObjectTypeSpreadProperty') {
        return flattenProperties(
          parser.getProperties(property.argument.id.name, types),
          types,
          parser,
        );
      }
    })
    .reduce((acc, item) => {
      if (Array.isArray(item)) {
        item.forEach(prop => {
          verifyPropNotAlreadyDefined(acc, prop);
        });
        return acc.concat(item);
      } else {
        verifyPropNotAlreadyDefined(acc, item);
        acc.push(item);
        return acc;
      }
    }, [])
    .filter(Boolean);
}

// $FlowFixMe[unsupported-variance-annotation]
function getTypeAnnotation(
  name,
  annotation,
  defaultValue,
  withNullDefault,
  types,
  parser,
  buildSchema,
) {
  const typeAnnotation = getValueFromTypes(annotation, types);
  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    parser.getTypeAnnotationName(typeAnnotation) === '$ReadOnlyArray'
  ) {
    return {
      type: 'ArrayTypeAnnotation',
      elementType: getTypeAnnotationForArray(
        name,
        typeAnnotation.typeParameters.params[0],
        defaultValue,
        types,
        parser,
        buildSchema,
      ),
    };
  }
  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    parser.getTypeAnnotationName(typeAnnotation) === '$ReadOnly'
  ) {
    return {
      type: 'ObjectTypeAnnotation',
      properties: flattenProperties(
        typeAnnotation.typeParameters.params[0].properties,
        types,
        parser,
      )
        .map(prop => buildSchema(prop, types, parser))
        .filter(Boolean),
    };
  }
  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? parser.getTypeAnnotationName(typeAnnotation)
      : typeAnnotation.type;
  switch (type) {
    case 'ImageSource':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageSourcePrimitive',
      };
    case 'ImageRequest':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageRequestPrimitive',
      };
    case 'ColorValue':
    case 'ProcessedColorValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ColorPrimitive',
      };
    case 'ColorArrayValue':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: {
          type: 'ReservedPropTypeAnnotation',
          name: 'ColorPrimitive',
        },
      };
    case 'PointValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'PointPrimitive',
      };
    case 'EdgeInsetsValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'EdgeInsetsPrimitive',
      };
    case 'DimensionValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'DimensionPrimitive',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
        default: defaultValue ? defaultValue : 0,
      };
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
        default: defaultValue ? defaultValue : 0,
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
        default: withNullDefault
          ? defaultValue
          : defaultValue
          ? defaultValue
          : 0,
      };
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
        default: withNullDefault
          ? defaultValue
          : defaultValue == null
          ? false
          : defaultValue,
      };
    case 'StringTypeAnnotation':
      if (typeof defaultValue !== 'undefined') {
        return {
          type: 'StringTypeAnnotation',
          default: defaultValue,
        };
      }
      throw new Error(`A default string (or null) is required for "${name}"`);
    case 'Stringish':
      if (typeof defaultValue !== 'undefined') {
        return {
          type: 'StringTypeAnnotation',
          default: defaultValue,
        };
      }
      throw new Error(`A default string (or null) is required for "${name}"`);
    case 'UnionTypeAnnotation':
      typeAnnotation.types.reduce((lastType, currType) => {
        if (lastType && currType.type !== lastType.type) {
          throw new Error(`Mixed types are not supported (see "${name}").`);
        }
        return currType;
      });
      if (defaultValue === null) {
        throw new Error(`A default enum value is required for "${name}"`);
      }
      const unionType = typeAnnotation.types[0].type;
      if (unionType === 'StringLiteralTypeAnnotation') {
        return {
          type: 'StringEnumTypeAnnotation',
          default: defaultValue,
          options: typeAnnotation.types.map(option => option.value),
        };
      } else if (unionType === 'NumberLiteralTypeAnnotation') {
        return {
          type: 'Int32EnumTypeAnnotation',
          default: defaultValue,
          options: typeAnnotation.types.map(option => option.value),
        };
      } else {
        throw new Error(
          `Unsupported union type for "${name}", received "${unionType}"`,
        );
      }
    case 'ObjectTypeAnnotation':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": object types must be declared using $ReadOnly<>`,
      );
    case 'NumberTypeAnnotation':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": must use a specific numeric type like Int32, Double, or Float`,
      );
    case 'UnsafeMixed':
      return {
        type: 'MixedTypeAnnotation',
      };
    default:
      throw new Error(
        `Unknown property type for "${name}": "${type}" in the State`,
      );
  }
}
function getSchemaInfo(property, types) {
  const name = property.key.name;
  const value = getValueFromTypes(property.value, types);
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
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === 'WithDefault'
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
  let withNullDefault = false;
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
      defaultValue = null;
      withNullDefault = true;
    }
  }
  return {
    name,
    optional,
    typeAnnotation,
    defaultValue,
    withNullDefault,
  };
}
module.exports = {
  getSchemaInfo,
  getTypeAnnotation,
  flattenProperties,
};
