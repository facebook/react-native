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
import type {SchemaType} from '../../CodegenSchema.js';

const {parseFile} = require('../../parsers/utils');
const FlowParser = require('../../parsers/flow');
const TypeScriptParser = require('../../parsers/typescript');
const fs = require('fs');
const path = require('path');

function combineSchemas(files: Array<string>): SchemaType {
  return files.reduce(
    (merged, filename) => {
      const contents = fs.readFileSync(filename, 'utf8');

      if (
        contents &&
        (/export\s+default\s+\(?codegenNativeComponent</.test(contents) ||
          /extends TurboModule/.test(contents))
      ) {
        const isTypeScript =
          path.extname(filename) === '.ts' || path.extname(filename) === '.tsx';

        const schema = parseFile(
          filename,
          isTypeScript ? TypeScriptParser.buildSchema : FlowParser.buildSchema,
        );

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
