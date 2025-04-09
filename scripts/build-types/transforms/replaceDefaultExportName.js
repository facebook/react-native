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

function createReplaceDefaultExportName(filePath: string): PluginObj<mixed> {
  return {
    visitor: {
      Identifier(node) {
        const fileName = filePath.split('/').pop() ?? '';
        const moduleName = fileName.split('.')[0];

        if (node.node.name === '$$EXPORT_DEFAULT_DECLARATION$$') {
          node.node.name = `${moduleName}_DEFAULT`;
        }
      },
    },
  };
}

module.exports = createReplaceDefaultExportName;
