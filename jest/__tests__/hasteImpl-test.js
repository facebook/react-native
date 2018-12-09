/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+js_foundation
 */

'use strict';

const path = require('path');
const fs = require('fs');

const {getHasteName} = require('../hasteImpl');

// RNPM currently does not support plugins when using Yarn Plug 'n Play
const testIfNotPnP = fs.existsSync(
  path.join(
    __dirname,
    '../..',
    'node_modules',
    'react-native-dummy',
    'package.json',
  ),
)
  ? test
  : test.skip;

function getPath(...parts) {
  return path.join(__dirname, '..', '..', ...parts);
}

it('returns the correct haste name for a RN library file', () => {
  expect(
    getHasteName(
      getPath(
        'Libraries',
        'Components',
        'AccessibilityInfo',
        'AccessibilityInfo.js',
      ),
    ),
  ).toEqual('AccessibilityInfo');
});

it('returns the correct haste name for a file with a platform suffix', () => {
  for (const platform of ['android', 'ios', 'native']) {
    expect(
      getHasteName(
        getPath(
          'Libraries',
          'Components',
          'AccessibilityInfo',
          `AccessibilityInfo.${platform}.js`,
        ),
      ),
    ).toEqual('AccessibilityInfo');
  }
});

testIfNotPnP(
  'returns the correct haste name for a file with an out-of-tree platform suffix',
  () => {
    for (const platform of ['dummy']) {
      expect(
        getHasteName(
          getPath(
            'Libraries',
            'Components',
            'AccessibilityInfo',
            `AccessibilityInfo.${platform}.js`,
          ),
        ),
      ).toEqual('AccessibilityInfo');
    }
  },
);

it('returns the correct haste name for a file with a flow suffix', () => {
  expect(
    getHasteName(
      getPath(
        'Libraries',
        'Components',
        'AccessibilityInfo',
        'AccessibilityInfo.ios.js.flow',
      ),
    ),
  ).toEqual('AccessibilityInfo');
});

it('does not calculate the haste name for a file that is not JS', () => {
  expect(
    getHasteName(
      getPath(
        'Libraries',
        'Components',
        'AccessibilityInfo',
        'AccessibilityInfo.txt',
      ),
    ),
  ).toBe(undefined);
});

it('does not calculate the haste name for a file outside of RN', () => {
  expect(
    getHasteName(getPath('..', 'Libraries', 'AccessibilityInfo.txt')),
  ).toBe(undefined);
});

it('does not calculate the haste name for a blacklisted file', () => {
  expect(
    getHasteName(
      getPath(
        'Libraries',
        'Components',
        '__mocks__',
        'AccessibilityInfo',
        'AccessibilityInfo.js',
      ),
    ),
  ).toBe(undefined);
});
