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

function upperCaseFirst(inString) {
  return inString[0].toUpperCase() + inString.slice(1);
}
function getInterfaceJavaClassName(componentName) {
  return `${componentName.replace(/^RCT/, '')}ManagerInterface`;
}
function getDelegateJavaClassName(componentName) {
  return `${componentName.replace(/^RCT/, '')}ManagerDelegate`;
}
function toSafeJavaString(input, shouldUpperCaseFirst) {
  const parts = input.split('-');
  if (shouldUpperCaseFirst === false) {
    return parts.join('');
  }
  return parts.map(upperCaseFirst).join('');
}
function getImports(component, type) {
  const imports = new Set();
  component.extendsProps.forEach(extendProps => {
    switch (extendProps.type) {
      case 'ReactNativeBuiltInType':
        switch (extendProps.knownTypeName) {
          case 'ReactNativeCoreViewProps':
            imports.add('import android.view.View;');
            return;
          default:
            extendProps.knownTypeName;
            throw new Error('Invalid knownTypeName');
        }
      default:
        extendProps.type;
        throw new Error('Invalid extended type');
    }
  });
  function addImportsForNativeName(name) {
    switch (name) {
      case 'ColorPrimitive':
        if (type === 'delegate') {
          imports.add('import com.facebook.react.bridge.ColorPropConverter;');
        }
        return;
      case 'ImageSourcePrimitive':
        imports.add('import com.facebook.react.bridge.ReadableMap;');
        return;
      case 'PointPrimitive':
        imports.add('import com.facebook.react.bridge.ReadableMap;');
        return;
      case 'EdgeInsetsPrimitive':
        imports.add('import com.facebook.react.bridge.ReadableMap;');
        return;
      case 'DimensionPrimitive':
        if (type === 'delegate') {
          imports.add(
            'import com.facebook.react.bridge.DimensionPropConverter;',
          );
        } else {
          imports.add('import com.facebook.yoga.YogaValue;');
        }
        return;
      default:
        name;
        throw new Error(`Invalid ReservedPropTypeAnnotation name, got ${name}`);
    }
  }
  component.props.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;
    if (typeAnnotation.type === 'ReservedPropTypeAnnotation') {
      addImportsForNativeName(typeAnnotation.name);
    }
    if (typeAnnotation.type === 'ArrayTypeAnnotation') {
      imports.add('import com.facebook.react.bridge.ReadableArray;');
    }
    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      imports.add('import com.facebook.react.bridge.ReadableMap;');
    }
    if (typeAnnotation.type === 'MixedTypeAnnotation') {
      if (type === 'delegate') {
        imports.add('import com.facebook.react.bridge.DynamicFromObject;');
      } else {
        imports.add('import com.facebook.react.bridge.Dynamic;');
      }
    }
  });
  return imports;
}
module.exports = {
  getInterfaceJavaClassName,
  getDelegateJavaClassName,
  toSafeJavaString,
  getImports,
};
