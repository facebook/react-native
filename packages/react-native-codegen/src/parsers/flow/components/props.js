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
  ExtendsPropsShape,
  NamedShape,
  PropTypeAnnotation,
} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap, PropAST} from '../../utils';
import type {Parser} from '../../parser';

const {
  flattenProperties,
  getSchemaInfo,
  getTypeAnnotation,
} = require('./componentsUtils.js');

type ExtendsForProp = null | {
  type: 'ReactNativeBuiltInType',
  knownTypeName: 'ReactNativeCoreViewProps',
};

function buildPropSchema(
  property: PropAST,
  types: TypeDeclarationMap,
): ?NamedShape<PropTypeAnnotation> {
  const info = getSchemaInfo(property, types);
  if (info == null) {
    return null;
  }
  const {name, optional, typeAnnotation, defaultValue, withNullDefault} = info;

  return {
    name,
    optional,
    typeAnnotation: getTypeAnnotation(
      name,
      typeAnnotation,
      defaultValue,
      withNullDefault,
      types,
      buildPropSchema,
    ),
  };
}

function extendsForProp(
  prop: PropAST,
  types: TypeDeclarationMap,
  parser: Parser,
): ExtendsForProp {
  const argument = parser.argumentForProp(prop);
  if (!argument) {
    console.log('null', prop);
  }
  const name = parser.nameForArgument(prop);

  if (types[name] != null) {
    // This type is locally defined in the file
    return null;
  }

  switch (name) {
    case 'ViewProps':
      return {
        type: 'ReactNativeBuiltInType',
        knownTypeName: 'ReactNativeCoreViewProps',
      };
    default: {
      throw new Error(`Unable to handle prop spread: ${name}`);
    }
  }
}

function removeKnownExtends(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): $ReadOnlyArray<PropAST> {
  return typeDefinition.filter(
    prop =>
      prop.type !== 'ObjectTypeSpreadProperty' ||
      extendsForProp(prop, types, parser) === null,
  );
}

function getExtendsProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): $ReadOnlyArray<ExtendsPropsShape> {
  return typeDefinition
    .filter(prop => prop.type === 'ObjectTypeSpreadProperty')
    .map(prop => extendsForProp(prop, types, parser))
    .filter(Boolean);
}
/**
 * Extracts the `props` and `extendsProps` (props with `extends` syntax)
 * from a type definition AST.
 */
function getProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): {
  props: $ReadOnlyArray<NamedShape<PropTypeAnnotation>>,
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
} {
  const nonExtendsProps = removeKnownExtends(typeDefinition, types, parser);
  const props = flattenProperties(nonExtendsProps, types)
    .map(property => buildPropSchema(property, types))
    .filter(Boolean);

  return {
    props,
    extendsProps: getExtendsProps(typeDefinition, types, parser),
  };
}

module.exports = {
  getProps,
};
