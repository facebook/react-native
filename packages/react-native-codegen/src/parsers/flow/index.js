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
const {buildSchema} = require('./buildSchema');
const {FlowParser} = require('./parser');

const parser = new FlowParser();

function parseModuleFixture(filename: string): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return buildSchema(contents, 'path/NativeSampleTurboModule.js', parser);
}

function parseString(contents: string, filename: ?string): SchemaType {
  return buildSchema(contents, filename, parser);
}

module.exports = {
  parseModuleFixture,
  parseString,
};
