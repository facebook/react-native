/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../getPlatformExtension');

var getPlatformExtension = require('../getPlatformExtension');

const TEST_PLATFORMS = new Set(['ios', 'android']);

describe('getPlatformExtension', function() {
  it('should get platform ext', function() {
    const get = name => getPlatformExtension(name, TEST_PLATFORMS);
    expect(get('a.ios.js')).toBe('ios');
    expect(get('a.android.js')).toBe('android');
    expect(get('/b/c/a.ios.js')).toBe('ios');
    expect(get('/b/c.android/a.ios.js')).toBe('ios');
    expect(get('/b/c/a@1.5x.ios.png')).toBe('ios');
    expect(get('/b/c/a@1.5x.lol.png')).toBe(null);
    expect(get('/b/c/a.lol.png')).toBe(null);
    expect(getPlatformExtension('a.ios.js', new Set(['ios']))).toBe('ios');
    expect(getPlatformExtension('a.android.js', new Set(['android']))).toBe('android');
    expect(getPlatformExtension('a.ios.js', new Set(['ubuntu']))).toBe(null);
    expect(getPlatformExtension('a.ubuntu.js', new Set(['ubuntu']))).toBe('ubuntu');
  });
});
