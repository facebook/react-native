/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

jest.disableAutomock();
jest.useRealTimers();

const Packager = require('../..');

const path = require('path');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30 * 1000;

const INPUT_PATH = path.resolve(__dirname, '../basic_bundle');
const POLYFILLS_PATH = path.resolve(__dirname, '../../src/Resolver/polyfills');

describe('basic_bundle', () => {
  it('bundles package as expected', async () => {
    const bundle = await Packager.buildBundle(
      {
        projectRoots: [INPUT_PATH, POLYFILLS_PATH],
        transformCache: Packager.TransformCaching.none(),
        transformModulePath: require.resolve('../../transformer'),
      },
      {
        dev: false,
        entryFile: path.join(INPUT_PATH, 'TestBundle.js'),
        platform: 'ios',
      },
    );
    const absPathRe = new RegExp(INPUT_PATH, 'g');
    expect(bundle.getSource().replace(absPathRe, '')).toMatchSnapshot();
  });
});
