/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const WebViewShared = require('WebViewShared');

describe('WebViewShared', () => {
  it('extracts the origin correctly', () => {
    expect(WebViewShared.extractOrigin('http://facebook.com')).toBe(
      'http://facebook.com',
    );
    expect(WebViewShared.extractOrigin('https://facebook.com')).toBe(
      'https://facebook.com',
    );
    expect(WebViewShared.extractOrigin('http://facebook.com:8081')).toBe(
      'http://facebook.com:8081',
    );
    expect(WebViewShared.extractOrigin('ftp://facebook.com')).toBe(
      'ftp://facebook.com',
    );
    expect(WebViewShared.extractOrigin('myweirdscheme://')).toBe(
      'myweirdscheme://',
    );
    expect(WebViewShared.extractOrigin('http://facebook.com/')).toBe(
      'http://facebook.com',
    );
    expect(WebViewShared.extractOrigin('http://facebook.com/longerurl')).toBe(
      'http://facebook.com',
    );
    expect(
      WebViewShared.extractOrigin('http://facebook.com/http://facebook.com'),
    ).toBe('http://facebook.com');
    expect(
      WebViewShared.extractOrigin('http://facebook.com//http://facebook.com'),
    ).toBe('http://facebook.com');
    expect(
      WebViewShared.extractOrigin('http://facebook.com//http://facebook.com//'),
    ).toBe('http://facebook.com');
    expect(WebViewShared.extractOrigin('about:blank')).toBe('about:blank');
  });

  it('rejects bad urls', () => {
    expect(WebViewShared.extractOrigin('a/b')).toBeNull();
    expect(WebViewShared.extractOrigin('a//b')).toBeNull();
  });

  it('creates a whitelist regex correctly', () => {
    expect(WebViewShared.originWhitelistToRegex('http://*')).toBe('http://.*');
    expect(WebViewShared.originWhitelistToRegex('*')).toBe('.*');
    expect(WebViewShared.originWhitelistToRegex('*//test')).toBe('.*//test');
    expect(WebViewShared.originWhitelistToRegex('*/*')).toBe('.*/.*');
    expect(WebViewShared.originWhitelistToRegex('*.com')).toBe('.*\\.com');
  });
});
