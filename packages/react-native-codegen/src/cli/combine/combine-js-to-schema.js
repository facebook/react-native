/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';
import type {SchemaType} from '../../CodegenSchema.js';

const FlowParser = require('../../parsers/flow');
const fs = require('fs');

function combineSchemas(files: Array<string>): SchemaType {
  return files.reduce(
    (merged, filename) => {
      const contents = fs.readFileSync(filename, 'utf8');
      if (
        contents &&
        (/export\s+default\s+\(?codegenNativeComponent</.test(contents) ||
          /extends TurboModule/.test(contents))
      ) {
        const schema = FlowParser.parseFile(filename);

        if (schema && schema.modules) {
          merged.modules = {...merged.modules, ...schema.modules};
        }
      }
      return merged;
    },
    {modules: {}},
  );
}

module.exports = combineSchemas;
