/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ExtendsPropsShape} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../../utils';
const {parseTopLevelType} = require('../parseTopLevelType');
const {flattenProperties} = require('./componentsUtils.js');

function extendsForProp(prop: PropsAST, types: TypeDeclarationMap) {
  if (!prop.expression) {
    console.log('null', prop);
  }
  const name = prop.expression.name;

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

function isEvent(typeAnnotation: $FlowFixMe): boolean {
  if (typeAnnotation.type !== 'TSTypeReference') {
    return false;
  }
  const eventNames = new Set(['BubblingEventHandler', 'DirectEventHandler']);
  return eventNames.has(typeAnnotation.typeName.name);
}

function isProp(name: string, typeAnnotation: $FlowFixMe): boolean {
  if (typeAnnotation.type !== 'TSTypeReference') {
    return true;
  }
  const isStyle =
    name === 'style' &&
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.typeName.name === 'ViewStyleProp';
  return !isStyle;
}

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type PropsAST = Object;

function categorizeProps(
  typeDefinition: $ReadOnlyArray<PropsAST>,
  types: TypeDeclarationMap,
  extendsProps: Array<ExtendsPropsShape>,
  props: Array<PropsAST>,
  events: Array<PropsAST>,
): void {
  const remaining: Array<PropsAST> = [];
  for (const prop of typeDefinition) {
    // find extends
    if (prop.type === 'TSExpressionWithTypeArguments') {
      const extend = extendsForProp(prop, types);
      if (extend) {
        extendsProps.push(extend);
        continue;
      }
    }

    remaining.push(prop);
  }

  // find events and props
  for (const prop of flattenProperties(remaining, types)) {
    if (prop.type === 'TSPropertySignature') {
      const topLevelType = parseTopLevelType(
        prop.typeAnnotation.typeAnnotation,
        types,
      );

      if (isEvent(topLevelType.type)) {
        events.push(prop);
      } else if (isProp(prop.key.name, prop)) {
        props.push(prop);
      }
    }
  }
}

module.exports = {
  categorizeProps,
};
