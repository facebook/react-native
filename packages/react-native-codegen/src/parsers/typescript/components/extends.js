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

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type PropsAST = Object;

function categorizeProps(
  typeDefinition: $ReadOnlyArray<PropsAST>,
  types: TypeDeclarationMap,
  extendsProps: Array<ExtendsPropsShape>,
  props: Array<PropsAST>,
  events: Array<PropsAST>,
): void {
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
    if (prop.type === 'TSPropertySignature' && isEvent(prop)) {
      events.push(prop);
      continue;
    }

    // the rest are props
    props.push(prop);
  }
}

module.exports = {
  categorizeProps,
};
