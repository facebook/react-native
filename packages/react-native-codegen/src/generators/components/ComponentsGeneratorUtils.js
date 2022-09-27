/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  NamedShape,
  PropTypeAnnotation,
  StateTypeAnnotation,
} from '../../CodegenSchema';

import type {
  StringTypeAnnotation,
  ReservedPropTypeAnnotation,
  ObjectTypeAnnotation,
  Int32TypeAnnotation,
  FloatTypeAnnotation,
  DoubleTypeAnnotation,
  BooleanTypeAnnotation,
} from '../../CodegenSchema';

const {
  convertDefaultTypeToString,
  getCppTypeForAnnotation,
  getEnumMaskName,
  getEnumName,
  generateStructName,
} = require('./CppHelpers.js');

function getNativeTypeFromAnnotation(
  componentName: string,
  prop:
    | NamedShape<PropTypeAnnotation>
    | NamedShape<StateTypeAnnotation>
    | {
        name: string,
        typeAnnotation:
          | $FlowFixMe
          | DoubleTypeAnnotation
          | FloatTypeAnnotation
          | BooleanTypeAnnotation
          | Int32TypeAnnotation
          | StringTypeAnnotation
          | ObjectTypeAnnotation<PropTypeAnnotation>
          | ReservedPropTypeAnnotation
          | {
              +default: string,
              +options: $ReadOnlyArray<string>,
              +type: 'StringEnumTypeAnnotation',
            }
          | {
              +elementType: ObjectTypeAnnotation<PropTypeAnnotation>,
              +type: 'ArrayTypeAnnotation',
            },
      },
  nameParts: $ReadOnlyArray<string>,
): string {
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
      return getCppTypeForAnnotation(typeAnnotation.type);
    case 'ReservedPropTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return 'SharedColor';
        case 'ImageSourcePrimitive':
          return 'ImageSource';
        case 'PointPrimitive':
          return 'Point';
        case 'EdgeInsetsPrimitive':
          return 'EdgeInsets';
        default:
          (typeAnnotation.name: empty);
          throw new Error('Received unknown ReservedPropTypeAnnotation');
      }
    case 'ArrayTypeAnnotation': {
      const arrayType = typeAnnotation.elementType.type;
      if (arrayType === 'ArrayTypeAnnotation') {
        return `std::vector<${getNativeTypeFromAnnotation(
          componentName,
          {typeAnnotation: typeAnnotation.elementType, name: ''},
          nameParts.concat([prop.name]),
        )}>`;
      }
      if (arrayType === 'ObjectTypeAnnotation') {
        const structName = generateStructName(
          componentName,
          nameParts.concat([prop.name]),
        );
        return `std::vector<${structName}>`;
      }
      if (arrayType === 'StringEnumTypeAnnotation') {
        const enumName = getEnumName(componentName, prop.name);
        return getEnumMaskName(enumName);
      }
      const itemAnnotation = getNativeTypeFromAnnotation(
        componentName,
        {
          typeAnnotation: typeAnnotation.elementType,
          name: componentName,
        },
        nameParts.concat([prop.name]),
      );
      return `std::vector<${itemAnnotation}>`;
    }
    case 'ObjectTypeAnnotation': {
      return generateStructName(componentName, nameParts.concat([prop.name]));
    }
    case 'StringEnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
    case 'Int32EnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
    default:
      (typeAnnotation: empty);
      throw new Error(
        `Received invalid typeAnnotation for ${componentName} prop ${prop.name}, received ${typeAnnotation.type}`,
      );
  }
}

function getStateConstituents(
  componentName: string,
  stateShape: NamedShape<StateTypeAnnotation>,
): {
  name: string,
  varName: string,
  type: string,
  defaultValue: $FlowFixMe,
} {
  const name = stateShape.name;
  const varName = `${name}_`;
  const type = getNativeTypeFromAnnotation(componentName, stateShape, []);
  const defaultValue = convertDefaultTypeToString(componentName, stateShape);

  return {
    name,
    varName,
    type,
    defaultValue,
  };
}

module.exports = {
  getNativeTypeFromAnnotation,
  getStateConstituents,
};
