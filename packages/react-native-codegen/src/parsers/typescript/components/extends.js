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

function isEvent(typeAnnotation: $FlowFixMe) {
  switch (typeAnnotation.type) {
    case 'TSTypeReference':
      if (
        typeAnnotation.typeName.name !== 'BubblingEventHandler' &&
        typeAnnotation.typeName.name !== 'DirectEventHandler'
      ) {
        return false;
      } else {
        return true;
      }
    default:
      return false;
  }
}

function isProp(name: string, typeAnnotation: $FlowFixMe) {
  if (typeAnnotation.type === 'TSTypeReference') {
    // Remove unwanted types
    if (
      name === 'style' &&
      typeAnnotation.type === 'GenericTypeAnnotation' &&
      typeAnnotation.typeName.name === 'ViewStyleProp'
    ) {
      return false;
    }
  }
  return true;
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

    // find events
    if (prop.type === 'TSPropertySignature') {
      const topLevelType = parseTopLevelType(
        prop.typeAnnotation.typeAnnotation,
        types,
      );

      if (isEvent(topLevelType.type)) {
        events.push(prop);
        continue;
      }
    }

    remaining.push(prop);
  }

  // find props
  for (const prop of flattenProperties(remaining, types)) {
    if (isProp(prop.key.name, prop)) {
      props.push(prop);
    }
  }
}

module.exports = {
  categorizeProps,
};
