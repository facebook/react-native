/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

function toSafeCppString(input: string): string {
  return input
    .split('-')
    .map(upperCaseFirst)
    .join('');
}

function getCppTypeForAnnotation(
  type:
    | 'BooleanTypeAnnotation'
    | 'StringTypeAnnotation'
    | 'Int32TypeAnnotation'
    | 'FloatTypeAnnotation',
): string {
  switch (type) {
    case 'BooleanTypeAnnotation':
      return 'bool';
    case 'StringTypeAnnotation':
      return 'std::string';
    case 'Int32TypeAnnotation':
      return 'int';
    case 'FloatTypeAnnotation':
      return 'Float';
    default:
      (type: empty);
      throw new Error(`Receieved invalid typeAnnotation ${type}`);
  }
}

function getImports(component: ComponentShape): Set<string> {
  const imports: Set<string> = new Set();

  function addImportsForNativeName(name) {
    switch (name) {
      case 'ColorPrimitive':
        return;
      case 'PointPrimitive':
        return;
      case 'ImageSourcePrimitive':
        imports.add('#include <react/components/image/conversions.h>');
        return;
      default:
        (name: empty);
        throw new Error(`Invalid name, got ${name}`);
    }
  }

  component.props.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;

    if (typeAnnotation.type === 'NativePrimitiveTypeAnnotation') {
      addImportsForNativeName(typeAnnotation.name);
    }

    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'NativePrimitiveTypeAnnotation'
    ) {
      addImportsForNativeName(typeAnnotation.elementType.name);
    }
  });

  return imports;
}

module.exports = {
  getCppTypeForAnnotation,
  getImports,
  toSafeCppString,
};
