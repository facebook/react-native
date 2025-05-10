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

import * as t from '@babel/types';

// When @microsoft/api-extractor bundles @virtualized-list types into the
// rollup, it does so preserving the imports from react-native. This casues
// the type duplication under aliased names. I.e. View_2 instead of View.
// This plugin removes the imports from react-native and updates references
// to the aliased names.
const visitor: PluginObj<mixed> = {
  visitor: {
    Program(path) {
      path.traverse({
        ImportDeclaration(importPath) {
          const source = importPath.node.source.value;

          if (source === 'react-native') {
            const specifiers = importPath.node.specifiers;

            specifiers.forEach(specifier => {
              if (t.isImportSpecifier(specifier)) {
                const localName = specifier.local.name;
                const match = localName.match(/(\w+)_(\d+)/);

                if (match) {
                  const aliasName = match[1];
                  const aliasIndex = Number(match[2]) - 1;
                  const newName =
                    aliasIndex === 1 ? aliasName : `${aliasName}_${aliasIndex}`;

                  const binding = importPath.scope.getBinding(localName);
                  if (binding) {
                    binding.referencePaths.forEach(referencePath => {
                      // $FlowExpectedError[prop-missing]
                      // $FlowExpectedError[incompatible-type]
                      referencePath.node.name = newName;
                    });
                    binding.identifier.name = newName;
                  }
                }
              }
            });

            importPath.remove();
          }
        },
      });
    },
  },
};

module.exports = visitor;
