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
import type {NamedShape, PropTypeAnnotation} from '../../CodegenSchema';

function upperCaseFirst(inString: string): string {
  if (inString.length === 0) {
    return inString;
  }

  return inString[0].toUpperCase() + inString.slice(1);
}

function toSafeCppString(input: string): string {
  return input.split('-').map(upperCaseFirst).join('');
}

function toIntEnumValueName(propName: string, value: number): string {
  return `${toSafeCppString(propName)}${value}`;
}

function getCppTypeForAnnotation(
  type:
    | 'BooleanTypeAnnotation'
    | 'StringTypeAnnotation'
    | 'Int32TypeAnnotation'
    | 'DoubleTypeAnnotation'
    | 'FloatTypeAnnotation',
): string {
  switch (type) {
    case 'BooleanTypeAnnotation':
      return 'bool';
    case 'StringTypeAnnotation':
      return 'std::string';
    case 'Int32TypeAnnotation':
      return 'int';
    case 'DoubleTypeAnnotation':
      return 'double';
    case 'FloatTypeAnnotation':
      return 'Float';
    default:
      (type: empty);
      throw new Error(`Received invalid typeAnnotation ${type}`);
  }
}

function getImports(
  properties: $ReadOnlyArray<NamedShape<PropTypeAnnotation>>,
): Set<string> {
  const imports: Set<string> = new Set();

  function addImportsForNativeName(
    name:
      | 'ColorPrimitive'
      | 'EdgeInsetsPrimitive'
      | 'ImageRequestPrimitive'
      | 'ImageSourcePrimitive'
      | 'PointPrimitive'
      | 'DimensionPrimitive',
  ) {
    switch (name) {
      case 'ColorPrimitive':
        return;
      case 'PointPrimitive':
        return;
      case 'EdgeInsetsPrimitive':
        return;
      case 'ImageRequestPrimitive':
        return;
      case 'ImageSourcePrimitive':
        imports.add('#include <react/renderer/components/image/conversions.h>');
        return;
      case 'DimensionPrimitive':
        imports.add('#include <react/renderer/components/view/conversions.h>');
        return;
      default:
        (name: empty);
        throw new Error(`Invalid name, got ${name}`);
    }
  }

  properties.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;

    if (typeAnnotation.type === 'ReservedPropTypeAnnotation') {
      addImportsForNativeName(typeAnnotation.name);
    }

    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'ReservedPropTypeAnnotation'
    ) {
      addImportsForNativeName(typeAnnotation.elementType.name);
    }

    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      const objectImports = getImports(typeAnnotation.properties);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      objectImports.forEach(imports.add, imports);
    }
  });

  return imports;
}

function generateEventStructName(parts: $ReadOnlyArray<string> = []): string {
  const additional = parts.map(toSafeCppString).join('');
  return `${additional}`;
}

function generateStructName(
  componentName: string,
  parts: $ReadOnlyArray<string> = [],
): string {
  const additional = parts.map(toSafeCppString).join('');
  return `${componentName}${additional}Struct`;
}

function getEnumName(componentName: string, propName: string): string {
  const uppercasedPropName = toSafeCppString(propName);
  return `${componentName}${uppercasedPropName}`;
}

function getEnumMaskName(enumName: string): string {
  return `${enumName}Mask`;
}

function convertDefaultTypeToString(
  componentName: string,
  prop: NamedShape<PropTypeAnnotation>,
): string {
  const typeAnnotation = prop.typeAnnotation;
  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
      if (typeAnnotation.default == null) {
        return '';
      }
      return String(typeAnnotation.default);
    case 'StringTypeAnnotation':
      if (typeAnnotation.default == null) {
        return '';
      }
      return `"${typeAnnotation.default}"`;
    case 'Int32TypeAnnotation':
      return String(typeAnnotation.default);
    case 'DoubleTypeAnnotation':
      const defaultDoubleVal = typeAnnotation.default;
      return parseInt(defaultDoubleVal, 10) === defaultDoubleVal
        ? typeAnnotation.default.toFixed(1)
        : String(typeAnnotation.default);
    case 'FloatTypeAnnotation':
      const defaultFloatVal = typeAnnotation.default;
      if (defaultFloatVal == null) {
        return '';
      }
      return parseInt(defaultFloatVal, 10) === defaultFloatVal
        ? defaultFloatVal.toFixed(1)
        : String(typeAnnotation.default);
    case 'ReservedPropTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'ColorPrimitive':
          return '';
        case 'ImageSourcePrimitive':
          return '';
        case 'ImageRequestPrimitive':
          return '';
        case 'PointPrimitive':
          return '';
        case 'EdgeInsetsPrimitive':
          return '';
        case 'DimensionPrimitive':
          return '';
        default:
          (typeAnnotation.name: empty);
          throw new Error(
            `Unsupported type annotation: ${typeAnnotation.name}`,
          );
      }
    case 'ArrayTypeAnnotation': {
      const elementType = typeAnnotation.elementType;
      switch (elementType.type) {
        case 'StringEnumTypeAnnotation':
          if (elementType.default == null) {
            throw new Error(
              'A default is required for array StringEnumTypeAnnotation',
            );
          }
          const enumName = getEnumName(componentName, prop.name);
          const enumMaskName = getEnumMaskName(enumName);
          const defaultValue = `${enumName}::${toSafeCppString(
            elementType.default,
          )}`;
          return `static_cast<${enumMaskName}>(${defaultValue})`;
        default:
          return '';
      }
    }
    case 'ObjectTypeAnnotation': {
      return '';
    }
    case 'StringEnumTypeAnnotation':
      return `${getEnumName(componentName, prop.name)}::${toSafeCppString(
        typeAnnotation.default,
      )}`;
    case 'Int32EnumTypeAnnotation':
      return `${getEnumName(componentName, prop.name)}::${toIntEnumValueName(
        prop.name,
        typeAnnotation.default,
      )}`;
    default:
      (typeAnnotation: empty);
      throw new Error(`Unsupported type annotation: ${typeAnnotation.type}`);
  }
}

module.exports = {
  convertDefaultTypeToString,
  getCppTypeForAnnotation,
  getEnumName,
  getEnumMaskName,
  getImports,
  toSafeCppString,
  toIntEnumValueName,
  generateStructName,
  generateEventStructName,
};
