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

const _require = require('./CppHelpers.js'),
  getCppTypeForAnnotation = _require.getCppTypeForAnnotation,
  getEnumMaskName = _require.getEnumMaskName,
  generateStructName = _require.generateStructName,
  getImports = _require.getImports;
const _require2 = require('../Utils'),
  getEnumName = _require2.getEnumName;
function getNativeTypeFromAnnotation(componentName, prop, nameParts) {
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
        case 'ImageRequestPrimitive':
          return 'ImageRequest';
        case 'PointPrimitive':
          return 'Point';
        case 'EdgeInsetsPrimitive':
          return 'EdgeInsets';
        case 'DimensionPrimitive':
          return 'YGValue';
        default:
          typeAnnotation.name;
          throw new Error('Received unknown ReservedPropTypeAnnotation');
      }
    case 'ArrayTypeAnnotation': {
      const arrayType = typeAnnotation.elementType.type;
      if (arrayType === 'ArrayTypeAnnotation') {
        return `std::vector<${getNativeTypeFromAnnotation(
          componentName,
          {
            typeAnnotation: typeAnnotation.elementType,
            name: '',
          },
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
    case 'MixedTypeAnnotation':
      return 'folly::dynamic';
    default:
      typeAnnotation;
      throw new Error(
        `Received invalid typeAnnotation for ${componentName} prop ${prop.name}, received ${typeAnnotation.type}`,
      );
  }
}

/// This function process some types if we need to customize them
/// For example, the ImageSource and the reserved types could be trasformed into
/// const address instead of using them as plain types.
function convertTypesToConstAddressIfNeeded(type, convertibleTypes) {
  if (convertibleTypes.has(type)) {
    return `${type} const &`;
  }
  return type;
}
function convertValueToSharedPointerWithMove(type, value, convertibleTypes) {
  if (convertibleTypes.has(type)) {
    return `std::make_shared<${type}>(std::move(${value}))`;
  }
  return value;
}
function convertVariableToSharedPointer(type, convertibleTypes) {
  if (convertibleTypes.has(type)) {
    return `std::shared_ptr<${type}>`;
  }
  return type;
}
function convertVariableToPointer(type, value, convertibleTypes) {
  if (convertibleTypes.has(type)) {
    return `*${value}`;
  }
  return value;
}
const convertCtorParamToAddressType = type => {
  const typesToConvert = new Set();
  typesToConvert.add('ImageSource');
  return convertTypesToConstAddressIfNeeded(type, typesToConvert);
};
const convertCtorInitToSharedPointers = (type, value) => {
  const typesToConvert = new Set();
  typesToConvert.add('ImageRequest');
  return convertValueToSharedPointerWithMove(type, value, typesToConvert);
};
const convertGettersReturnTypeToAddressType = type => {
  const typesToConvert = new Set();
  typesToConvert.add('ImageRequest');
  return convertTypesToConstAddressIfNeeded(type, typesToConvert);
};
const convertVarTypeToSharedPointer = type => {
  const typesToConvert = new Set();
  typesToConvert.add('ImageRequest');
  return convertVariableToSharedPointer(type, typesToConvert);
};
const convertVarValueToPointer = (type, value) => {
  const typesToConvert = new Set();
  typesToConvert.add('ImageRequest');
  return convertVariableToPointer(type, value, typesToConvert);
};
function getLocalImports(properties) {
  const imports = new Set();
  function addImportsForNativeName(name) {
    switch (name) {
      case 'ColorPrimitive':
        imports.add('#include <react/renderer/graphics/Color.h>');
        return;
      case 'ImageSourcePrimitive':
        imports.add('#include <react/renderer/imagemanager/primitives.h>');
        return;
      case 'ImageRequestPrimitive':
        imports.add('#include <react/renderer/imagemanager/ImageRequest.h>');
        return;
      case 'PointPrimitive':
        imports.add('#include <react/renderer/graphics/Point.h>');
        return;
      case 'EdgeInsetsPrimitive':
        imports.add('#include <react/renderer/graphics/RectangleEdges.h>');
        return;
      case 'DimensionPrimitive':
        imports.add('#include <yoga/Yoga.h>');
        return;
      default:
        name;
        throw new Error(`Invalid ReservedPropTypeAnnotation name, got ${name}`);
    }
  }
  properties.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;
    if (typeAnnotation.type === 'ReservedPropTypeAnnotation') {
      addImportsForNativeName(typeAnnotation.name);
    }
    if (typeAnnotation.type === 'ArrayTypeAnnotation') {
      imports.add('#include <vector>');
      if (typeAnnotation.elementType.type === 'StringEnumTypeAnnotation') {
        imports.add('#include <cinttypes>');
      }
    }
    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'ReservedPropTypeAnnotation'
    ) {
      addImportsForNativeName(typeAnnotation.elementType.name);
    }
    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'ObjectTypeAnnotation'
    ) {
      imports.add('#include <react/renderer/core/propsConversions.h>');
      const objectProps = typeAnnotation.elementType.properties;
      // $FlowFixMe[incompatible-call] the type is guaranteed to be ObjectTypeAnnotation<PropTypeAnnotation>
      const objectImports = getImports(objectProps);
      // $FlowFixMe[incompatible-call] the type is guaranteed to be ObjectTypeAnnotation<PropTypeAnnotation>
      const localImports = getLocalImports(objectProps);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      objectImports.forEach(imports.add, imports);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      localImports.forEach(imports.add, imports);
    }
    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      imports.add('#include <react/renderer/core/propsConversions.h>');
      const objectImports = getImports(typeAnnotation.properties);
      const localImports = getLocalImports(typeAnnotation.properties);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      objectImports.forEach(imports.add, imports);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      localImports.forEach(imports.add, imports);
    }
  });
  return imports;
}
module.exports = {
  getNativeTypeFromAnnotation,
  convertCtorParamToAddressType,
  convertGettersReturnTypeToAddressType,
  convertCtorInitToSharedPointers,
  convertVarTypeToSharedPointer,
  convertVarValueToPointer,
  getLocalImports,
};
