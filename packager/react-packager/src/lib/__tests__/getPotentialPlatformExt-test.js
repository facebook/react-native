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

describe('getPlatformExtension', function() {
  it('should get platform ext', function() {
    var getPlatformExtension = require('../getPlatformExtension');
    expect(getPlatformExtension('a.ios.js')).toBe('ios');
    expect(getPlatformExtension('a.android.js')).toBe('android');
    expect(getPlatformExtension('/b/c/a.ios.js')).toBe('ios');
    expect(getPlatformExtension('/b/c.android/a.ios.js')).toBe('ios');
    expect(getPlatformExtension('/b/c/a@1.5x.ios.png')).toBe('ios');
    expect(getPlatformExtension('/b/c/a@1.5x.lol.png')).toBe(null);
    expect(getPlatformExtension('/b/c/a.lol.png')).toBe(null);
  });
});
