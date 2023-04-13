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
import type {TypeDeclarationMap} from '../../utils';

const {
  flattenProperties,
  getSchemaInfo,
  getTypeAnnotation,
} = require('./componentsUtils.js');

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type PropAST = Object;

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
): ExtendsForProp {
  if (!prop.argument) {
    console.log('null', prop);
  }
  const name = prop.argument.id.name;

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
): $ReadOnlyArray<PropAST> {
  return typeDefinition.filter(
    prop =>
      prop.type !== 'ObjectTypeSpreadProperty' ||
      extendsForProp(prop, types) === null,
  );
}

function getExtendsProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<ExtendsPropsShape> {
  return typeDefinition
    .filter(prop => prop.type === 'ObjectTypeSpreadProperty')
    .map(prop => extendsForProp(prop, types))
    .filter(Boolean);
}
/**
 * Extracts the `props` and `extendsProps` (props with `extends` syntax)
 * from a type definition AST.
 */
function getProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): {
  props: $ReadOnlyArray<NamedShape<PropTypeAnnotation>>,
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
} {
  const nonExtendsProps = removeKnownExtends(typeDefinition, types);
  const props = flattenProperties(nonExtendsProps, types)
    .map(property => buildPropSchema(property, types))
    .filter(Boolean);

  return {
    props,
    extendsProps: getExtendsProps(typeDefinition, types),
  };
}

module.exports = {
  getProps,
};
