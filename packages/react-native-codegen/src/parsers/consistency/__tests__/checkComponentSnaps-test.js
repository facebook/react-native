/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

'use strict';

const {compareSnaps, compareTsArraySnaps} = require('../compareSnaps.js');

const flowFixtures = require('../../flow/components/__test_fixtures__/fixtures.js');
const flowSnaps = require('../../../../src/parsers/flow/components/__tests__/__snapshots__/component-parser-test.js.snap');
const tsFixtures = require('../../typescript/components/__test_fixtures__/fixtures.js');
const tsSnaps = require('../../../../src/parsers/typescript/components/__tests__/__snapshots__/typescript-component-parser-test.js.snap');
const tsExtraCases = ['ARRAY2_PROP_TYPES_NO_EVENTS'];

compareSnaps(flowFixtures, flowSnaps, [], tsFixtures, tsSnaps, tsExtraCases);
compareTsArraySnaps(tsSnaps, tsExtraCases);
