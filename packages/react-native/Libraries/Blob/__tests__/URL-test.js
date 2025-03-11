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

const URL = require('../URL').URL;

describe('URL', function () {
  it('should correctly parse all URL components', () => {
    const url = new URL('https://username:password@reactnative.dev:8080/docs/path?query=testQuery&key=value#fragment');

    expect(url.hash).toBe('#fragment');
    expect(url.host).toBe('reactnative.dev:8080');
    expect(url.hostname).toBe('reactnative.dev');
    expect(url.password).toBe('password');
    expect(url.username).toBe('username');
    expect(url.pathname).toBe('/docs/path');
    expect(url.port).toBe('8080');
    expect(url.search).toBe('?query=testQuery&key=value');

    // Test searchParams parsing
    expect(url.searchParams.get('query')).toBe('testQuery');
    expect(url.searchParams.get('key')).toBe('value');
  });

  it('should handle URLs without authentication correctly', () => {
    const url = new URL('https://reactnative.dev/docs');

    expect(url.username).toBe('');
    expect(url.password).toBe('');
  });

  it('should handle URLs without query parameters', () => {
    const url = new URL('https://reactnative.dev/docs');

    expect(url.search).toBe('');
    expect(url.searchParams.toString()).toBe('');
  });

  it('should handle URLs without a port', () => {
    const url = new URL('https://reactnative.dev/docs');

    expect(url.port).toBe('');
  });

  it('should handle URLs without a hash', () => {
    const url = new URL('https://reactnative.dev/docs');

    expect(url.hash).toBe('');
  });

  it('should handle URLs with relative paths correctly', () => {
    const base = new URL('https://developer.mozilla.org');
    
    const url1 = new URL('/en-US/docs', base);
    expect(url1.href).toBe('https://developer.mozilla.org/en-US/docs');

    const url2 = new URL('en-US/docs', base);
    expect(url2.href).toBe('https://developer.mozilla.org/en-US/docs');
  });

  it('should support bare hosts and relative paths', () => {
    const url = new URL('home', 'http://localhost');
    expect(url.href).toBe('http://localhost/home');
  });

  it('should correctly resolve full URLs when given a base URL', () => {
    const url = new URL('http://github.com', 'http://google.com');
    expect(url.href).toBe('http://github.com/');
  });

  it('should insert / between base and path if missing', () => {
    const url = new URL('en-US/docs', 'https://developer.mozilla.org');
    expect(url.href).toBe('https://developer.mozilla.org/en-US/docs');
  });

  it('should default pathname to "/" if no path is provided', () => {
    const url = new URL('https://example.com');
    expect(url.pathname).toBe('/');
  });
});
