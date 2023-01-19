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

import type {ComponentShape} from '../../CodegenSchema';

function upperCaseFirst(inString: string): string {
  return inString[0].toUpperCase() + inString.slice(1);
}

function getInterfaceJavaClassName(componentName: string): string {
  return `${componentName.replace(/^RCT/, '')}ManagerInterface`;
}

function getDelegateJavaClassName(componentName: string): string {
  return `${componentName.replace(/^RCT/, '')}ManagerDelegate`;
}

function toSafeJavaString(
  input: string,
  shouldUpperCaseFirst?: boolean,
): string {
  const parts = input.split('-');

  if (shouldUpperCaseFirst === false) {
    return parts.join('');
  }

  return parts.map(upperCaseFirst).join('');
}

function getImports(
  component: ComponentShape,
  type: 'interface' | 'delegate',
): Set<string> {
  const imports: Set<string> = new Set();

  component.extendsProps.forEach(extendProps => {
    switch (extendProps.type) {
      case 'ReactNativeBuiltInType':
        switch (extendProps.knownTypeName) {
          case 'ReactNativeCoreViewProps':
            imports.add('import android.view.View;');
            return;
          default:
            (extendProps.knownTypeName: empty);
            throw new Error('Invalid knownTypeName');
        }
      default:
        (extendProps.type: empty);
        throw new Error('Invalid extended type');
    }
  });

  function addImportsForNativeName(
    name:
      | 'ColorPrimitive'
      | 'EdgeInsetsPrimitive'
      | 'ImageSourcePrimitive'
      | 'PointPrimitive'
      | $TEMPORARY$string<'ColorPrimitive'>
      | $TEMPORARY$string<'EdgeInsetsPrimitive'>
      | $TEMPORARY$string<'ImageSourcePrimitive'>
      | $TEMPORARY$string<'PointPrimitive'>,
  ) {
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
      default:
        (name: empty);
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
  });

  return imports;
}

module.exports = {
  getInterfaceJavaClassName,
  getDelegateJavaClassName,
  toSafeJavaString,
  getImports,
};
