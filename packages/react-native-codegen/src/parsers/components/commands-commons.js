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

import type {ComponentCommandArrayTypeAnnotation} from '../../CodegenSchema.js';
import type {Parser} from '../parser';

type Allowed = ComponentCommandArrayTypeAnnotation['elementType'];

/**
 * Shared command array element type resolution for Flow and TypeScript parsers.
 *
 * Uses parser.extractTypeFromTypeAnnotation() to resolve generic/reference types
 * and parser.convertKeywordToTypeAnnotation() to normalize language-specific keywords
 * to a common set of type names.
 */
function getCommandArrayElementTypeType(
  inputType: unknown,
  parser: Parser,
): Allowed {
  // TODO: T172453752 support more complex type annotation for array element
  if (inputType == null || typeof inputType !== 'object') {
    throw new Error(`Expected an object, received ${typeof inputType}`);
  }

  const rawType = inputType?.type;
  if (typeof rawType !== 'string') {
    throw new Error('Command array element type must be a string');
  }

  // $FlowFixMe[incompatible-call]
  const resolvedName = parser.extractTypeFromTypeAnnotation(inputType);
  const normalizedType = parser.convertKeywordToTypeAnnotation(resolvedName);

  switch (normalizedType) {
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
      };
    case 'StringTypeAnnotation':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
      };
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
      };
    default:
      // Unresolvable types (aliases to objects/unions) fall back to
      // MixedTypeAnnotation. Generators produce ReadableMap or
      // (const NSArray *) which are untyped.
      return {
        type: 'MixedTypeAnnotation',
      };
  }
}

module.exports = {
  getCommandArrayElementTypeType,
};
