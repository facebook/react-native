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

const {buildSchema} = require('../parsers-commons');
const {Visitor} = require('./Visitor');
const {FlowParser} = require('./parser');
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('./components/schema');
const {buildModuleSchema} = require('./modules');

const parser = new FlowParser();

function parseModuleFixture(filename: string): SchemaType {
  const contents = fs.readFileSync(filename, 'utf8');

  return parseString(contents, 'path/NativeSampleTurboModule.js');
}

function parseString(contents: string, filename: ?string): SchemaType {
  return buildSchema(
    contents,
    filename,
    wrapComponentSchema,
    buildComponentSchema,
    buildModuleSchema,
    Visitor,
    parser,
  );
}

module.exports = {
  parseModuleFixture,
  parseString,
};
