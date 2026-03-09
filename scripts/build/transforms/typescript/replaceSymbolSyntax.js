/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {PluginObj} from '@babel/core';

const symbolReplacements: {[string]: string} = {
  __iterator: 'iterator',
  __asyncIterator: 'asyncIterator',
  __dispose: 'dispose',
  __asyncDispose: 'asyncDispose',
};

/**
 * Replaces __symbol prefixed method identifiers (e.g. __iterator) with
 * computed [Symbol.*] syntax (e.g. [Symbol.iterator]) in TypeScript
 * definitions.
 *
 * This is the second phase of a two-phase transform. Flow uses @@symbol
 * syntax (e.g. @@iterator) to represent well-known symbols, but this syntax
 * is not valid in TypeScript. Since flow-api-translator doesn't understand
 * @@symbol syntax either, we split the conversion into two steps:
 *
 * 1. Pre-translation (Flow → Flow): replaceSymbolSyntax in transforms/flow
 *    rewrites @@symbol to __symbol identifiers, which are valid Flow
 *    identifiers that survive the flow-api-translator pass.
 * 2. Post-translation (TS → TS): this transform rewrites __symbol identifiers
 *    to computed [Symbol.*] properties, which is the correct TypeScript syntax.
 */
const replaceSymbolSyntax: PluginObj<unknown> = {
  visitor: {
    TSMethodSignature(path) {
      const {key} = path.node;

      if (key.type === 'Identifier') {
        const replacement = symbolReplacements[key.name];

        if (replacement != null) {
          // $FlowFixMe[incompatible-type]
          path.replaceWith({
            ...path.node,
            computed: true,
            key: {
              type: 'MemberExpression',
              object: {type: 'Identifier', name: 'Symbol'},
              property: {type: 'Identifier', name: replacement},
              computed: false,
            },
          });
        }
      }
    },
  },
};

module.exports = replaceSymbolSyntax;
