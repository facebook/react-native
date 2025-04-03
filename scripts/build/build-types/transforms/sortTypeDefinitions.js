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

const visitor: PluginObj<mixed> = {
  visitor: {
    Program(path) {
      path.node.body.sort((a, b) => {
        // Push import declarations at the top of the file
        if (t.isImportDeclaration(a) && !t.isImportDeclaration(b)) {
          return -1;
        } else if (!t.isImportDeclaration(a) && t.isImportDeclaration(b)) {
          return 1;
        }

        const aExported = t.isExportNamedDeclaration(a);
        const bExported = t.isExportNamedDeclaration(b);

        // Push exported declarations before non-exported declarations
        if (aExported && !bExported) {
          return -1;
        } else if (!aExported && bExported) {
          return 1;
        }

        return 0;
      });
    },
  },
};

module.exports = visitor;
