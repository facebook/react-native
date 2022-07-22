/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict-local
 * @format
 */

'use strict';

const {compareSnaps} = require('../compareSnaps.js');

const flowFixtures = require('../../flow/modules/__test_fixtures__/fixtures.js');
const flowSnaps = require('../../flow/modules/__tests__/__snapshots__/module-parser-snapshot-test.js.snap');
const tsFixtures = require('../../typescript/modules/__test_fixtures__/fixtures.js');
const tsSnaps = require('../../typescript/modules/__tests__/__snapshots__/typescript-module-parser-snapshot-test.js.snap');
const tsExtraCases = [
  'NATIVE_MODULE_WITH_ARRAY2_WITH_ALIAS',
  'NATIVE_MODULE_WITH_ARRAY2_WITH_UNION_AND_TOUPLE',
  'NATIVE_MODULE_WITH_BASIC_ARRAY2',
  'NATIVE_MODULE_WITH_COMPLEX_ARRAY2',
];

compareSnaps(flowFixtures, flowSnaps, [], tsFixtures, tsSnaps, tsExtraCases);
