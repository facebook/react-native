/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const path = require('path');
const _require = require('../../parsers/flow/parser'),
  FlowParser = _require.FlowParser;
const _require2 = require('../../parsers/typescript/parser'),
  TypeScriptParser = _require2.TypeScriptParser;
const flowParser = new FlowParser();
const typescriptParser = new TypeScriptParser();
function parseFiles(files) {
  files.forEach(filename => {
    const isTypeScript =
      path.extname(filename) === '.ts' || path.extname(filename) === '.tsx';
    const parser = isTypeScript ? typescriptParser : flowParser;
    console.log(filename, JSON.stringify(parser.parseFile(filename), null, 2));
  });
}
module.exports = parseFiles;
