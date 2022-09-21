/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const {compareSnaps, compareTsArraySnaps} = require('../compareSnaps.js');

const flowFixtures = require('../../flow/components/__test_fixtures__/fixtures.js');
const flowSnaps = require('../../../../src/parsers/flow/components/__tests__/__snapshots__/component-parser-test.js.snap');
const flowExtraCases = [
  //TODO: remove these once we implement TypeScript parser for Custom State
  'ALL_STATE_TYPES',
  'ARRAY_STATE_TYPES',
  'COMMANDS_EVENTS_STATE_TYPES_EXPORTED',
  'OBJECT_STATE_TYPES',
];
const tsFixtures = require('../../typescript/components/__test_fixtures__/fixtures.js');
const tsSnaps = require('../../../../src/parsers/typescript/components/__tests__/__snapshots__/typescript-component-parser-test.js.snap');
const tsExtraCases = ['ARRAY2_PROP_TYPES_NO_EVENTS'].concat([
  //TODO: remove these once we implement TypeScript parser for Custom State
  'COMMANDS_AND_EVENTS_TYPES_EXPORTED',
]);
const ignoredCases = ['ARRAY_PROP_TYPES_NO_EVENTS'];

compareSnaps(
  flowFixtures,
  flowSnaps,
  flowExtraCases,
  tsFixtures,
  tsSnaps,
  tsExtraCases,
  ignoredCases,
);
compareTsArraySnaps(tsSnaps, tsExtraCases);
