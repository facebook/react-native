/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .dontMock('../saveBundleAndMap')
  .dontMock('os-tmpdir')
  .dontMock('temp');

jest.mock('fs');

const saveBundleAndMap = require('../saveBundleAndMap');
const fs = require('fs');
const temp = require('temp');

const code = 'const foo = "bar";';
const map = JSON.stringify({
  version: 3,
  file: 'foo.js.map',
  sources: ['foo.js'],
  sourceRoot: '/',
  names: ['bar'],
  mappings: 'AAA0B,kBAAhBA,QAAOC,SACjBD,OAAOC,OAAO'
});

describe('saveBundleAndMap', () => {
  beforeEach(() => {
    fs.writeFileSync = jest.genMockFn();
  });

  it('should save bundle', () => {
    const codeWithMap = {code: code};
    const bundleOutput = temp.path({suffix: '.bundle'});

    saveBundleAndMap(
      codeWithMap,
      'ios',
      bundleOutput
    );

    expect(fs.writeFileSync.mock.calls[0]).toEqual([bundleOutput, code]);
  });

  it('should save sourcemaps if required so', () => {
    const codeWithMap = {code: code, map: map};
    const bundleOutput = temp.path({suffix: '.bundle'});
    const sourceMapOutput = temp.path({suffix: '.map'});
    saveBundleAndMap(
      codeWithMap,
      'ios',
      bundleOutput,
      sourceMapOutput
    );

    expect(fs.writeFileSync.mock.calls[1]).toEqual([sourceMapOutput, map]);
  });
});
