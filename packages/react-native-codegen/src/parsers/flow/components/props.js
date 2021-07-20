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

const {getValueFromTypes} = require('../utils.js');

import type {NamedShape, PropTypeAnnotation} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../utils.js';

function getPropProperties(
  propsTypeName: string,
  types: TypeDeclarationMap,
): $FlowFixMe {
  const typeAlias = types[propsTypeName];
  try {
    return typeAlias.right.typeParameters.params[0].properties;
  } catch (e) {
    throw new Error(
      `Failed to find type definition for "${propsTypeName}", please check that you have a valid codegen flow file`,
    );
  }
}

function getTypeAnnotationForArray(name, typeAnnotation, defaultValue, types) {
  const extractedTypeAnnotation = getValueFromTypes(typeAnnotation, types);
  if (extractedTypeAnnotation.type === 'NullableTypeAnnotation') {
    throw new Error(
      'Nested optionals such as "$ReadOnlyArray<?boolean>" are not supported, please declare optionals at the top level of value definitions as in "?$ReadOnlyArray<boolean>"',
    );
  }

  if (
    extractedTypeAnnotation.type === 'GenericTypeAnnotation' &&
    extractedTypeAnnotation.id.name === 'WithDefault'
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
        )
          .map(prop => buildPropSchema(prop, types))
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
          )
            .map(prop => buildPropSchema(prop, types))
            .filter(Boolean),
        },
      };
    }
  }

  const type =
    extractedTypeAnnotation.type === 'GenericTypeAnnotation'
      ? extractedTypeAnnotation.id.name
      : extractedTypeAnnotation.type;

  switch (type) {
    case 'ImageSource':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageSourcePrimitive',
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
          default: (defaultValue: string),
          options: typeAnnotation.types.map(option => option.value),
        };
      } else if (unionType === 'NumberLiteralTypeAnnotation') {
        throw new Error(
          `Arrays of int enums are not supported (see: "${name}")`,
        );
      } else {
        throw new Error(
          `Unsupported union type for "${name}", recieved "${unionType}"`,
        );
      }
    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${name}": ${type}`);
  }
}

function getTypeAnnotation(
  name,
  annotation,
  defaultValue,
  withNullDefault,
  types,
) {
  const typeAnnotation = getValueFromTypes(annotation, types);

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
        types,
      ),
    };
  }

  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id.name === '$ReadOnly'
  ) {
    return {
      type: 'ObjectTypeAnnotation',
      properties: flattenProperties(
        typeAnnotation.typeParameters.params[0].properties,
        types,
      )
        .map(prop => buildPropSchema(prop, types))
        .filter(Boolean),
    };
  }

  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'ImageSource':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageSourcePrimitive',
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
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
        default: ((defaultValue ? defaultValue : 0): number),
      };
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
        default: ((defaultValue ? defaultValue : 0): number),
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
        default: withNullDefault
          ? (defaultValue: number | null)
          : ((defaultValue ? defaultValue : 0): number),
      };
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
        default: withNullDefault
          ? (defaultValue: boolean | null)
          : ((defaultValue == null ? false : defaultValue): boolean),
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
          default: (defaultValue: string),
          options: typeAnnotation.types.map(option => option.value),
        };
      } else if (unionType === 'NumberLiteralTypeAnnotation') {
        return {
          type: 'Int32EnumTypeAnnotation',
          default: (defaultValue: number),
          options: typeAnnotation.types.map(option => option.value),
        };
      } else {
        throw new Error(
          `Unsupported union type for "${name}", received "${unionType}"`,
        );
      }
    case 'NumberTypeAnnotation':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": must use a specific numeric type like Int32, Double, or Float`,
      );
    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${name}": "${type}"`);
  }
}

function buildPropSchema(
  property,
  types: TypeDeclarationMap,
): ?NamedShape<PropTypeAnnotation> {
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
    typeAnnotation: getTypeAnnotation(
      name,
      typeAnnotation,
      defaultValue,
      withNullDefault,
      types,
    ),
  };
}

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type PropAST = Object;

function verifyPropNotAlreadyDefined(
  props: $ReadOnlyArray<PropAST>,
  needleProp: PropAST,
) {
  const propName = needleProp.key.name;
  const foundProp = props.some(prop => prop.key.name === propName);
  if (foundProp) {
    throw new Error(`A prop was already defined with the name ${propName}`);
  }
}

function flattenProperties(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
) {
  return typeDefinition
    .map(property => {
      if (property.type === 'ObjectTypeProperty') {
        return property;
      } else if (property.type === 'ObjectTypeSpreadProperty') {
        return flattenProperties(
          getPropProperties(property.argument.id.name, types),
          types,
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

function getProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<NamedShape<PropTypeAnnotation>> {
  return flattenProperties(typeDefinition, types)
    .map(property => buildPropSchema(property, types))
    .filter(Boolean);
}

module.exports = {
  getProps,
  getPropProperties,
};
