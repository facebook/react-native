/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../parsePlatformFilePath');

var parsePlatformFilePath = require('../parsePlatformFilePath');

const TEST_PLATFORMS = new Set(['ios', 'android']);

describe('parsePlatformFilePath', function() {
  it('should get platform ext', function() {
    const get = name => parsePlatformFilePath(name, TEST_PLATFORMS).platform;
    expect(get('a.js')).toBe(null);
    expect(get('a.ios.js')).toBe('ios');
    expect(get('a.android.js')).toBe('android');
    expect(get('/b/c/a.ios.js')).toBe('ios');
    expect(get('/b/c.android/a.ios.js')).toBe('ios');
    expect(get('/b/c/a@1.5x.ios.png')).toBe('ios');
    expect(get('/b/c/a@1.5x.lol.png')).toBe(null);
    expect(get('/b/c/a.lol.png')).toBe(null);
    expect(parsePlatformFilePath('a.ios.js', new Set(['ios'])).platform).toBe('ios');
    expect(parsePlatformFilePath('a.android.js', new Set(['android'])).platform).toBe('android');
    expect(parsePlatformFilePath('a.ios.js', new Set(['ubuntu'])).platform).toBe(null);
    expect(parsePlatformFilePath('a.ubuntu.js', new Set(['ubuntu'])).platform).toBe('ubuntu');
  });
});
