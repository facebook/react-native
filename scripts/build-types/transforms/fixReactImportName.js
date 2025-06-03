/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PluginObj} from '@babel/core';

const visitor: PluginObj<mixed> = {
  visitor: {
    Identifier(path) {
      // 'React' is a reserved symbol for api-extractor
      if (path.node.name === 'React_2') {
        path.node.name = 'React';
      }
    },
  },
};

module.exports = visitor;
