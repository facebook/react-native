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

import type {SchemaType} from '../../CodegenSchema.js';

const fs = require('fs');

const {TypeScriptParser} = require('./parser');

const parser = new TypeScriptParser();

function parseModuleFixture(filename: string): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return parser.parseString(contents, 'path/NativeSampleTurboModule.ts');
}

module.exports = {
  parseModuleFixture,
};
