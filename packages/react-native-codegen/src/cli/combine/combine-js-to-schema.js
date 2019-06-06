/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';
import type {SchemaType} from '../../CodegenSchema.js';

const SchemaParser = require('../../parsers/schema');

function combineSchemas(files: Array<string>): SchemaType {
  return files.reduce(
    (merged, filename) => {
      const schema = SchemaParser.parse(filename);
      if (schema && schema.modules) {
        merged.modules = {...merged.modules, ...schema.modules};
      }
      return merged;
    },
    {modules: {}},
  );
}

module.exports = combineSchemas;
