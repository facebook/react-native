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

const fs = require('fs');

const fixtures = require('../src/generators/__test_fixtures__/fixtures.js');

const args = process.argv.slice(2);
if (args.length !== 2) {
  throw new Error(
    'Expected to receive the fixture name and output directory as the only arg',
  );
}

const fixtureName = args[0];
const outputPath = args[1];

const fixture = fixtures[fixtureName];

if (fixture == null) {
  throw new Error(`Can't find fixture with name ${fixtureName}`);
}

fs.writeFileSync(outputPath, JSON.stringify(fixture, null, 2));
