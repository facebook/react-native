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
  it('should pass Mozilla Dev Network examples', () => {
    const a = new URL('/', 'https://developer.mozilla.org');
    expect(a.href).toBe('https://developer.mozilla.org/');
    const b = new URL('https://developer.mozilla.org');
    expect(b.href).toBe('https://developer.mozilla.org/');
    const c = new URL('en-US/docs', b);
    expect(c.href).toBe('https://developer.mozilla.org/en-US/docs');
    const d = new URL('/en-US/docs', b);
    expect(d.href).toBe('https://developer.mozilla.org/en-US/docs');
    const f = new URL('/en-US/docs', d);
    expect(f.href).toBe('https://developer.mozilla.org/en-US/docs');
    // from original test suite, but requires complex implementation
    // const g = new URL(
    //   '/en-US/docs',
    //   'https://developer.mozilla.org/fr-FR/toto',
    // );
    // expect(g.href).toBe('https://developer.mozilla.org/en-US/docs');
    const h = new URL('/en-US/docs', a);
    expect(h.href).toBe('https://developer.mozilla.org/en-US/docs');
    const i = new URL('http://github.com', 'http://google.com');
    expect(i.href).toBe('http://github.com/');
    // Support Bare Hosts
    const j = new URL('home', 'http://localhost');
    expect(j.href).toBe('http://localhost/home');
    // Insert / between Base and Path if missing
    const k = new URL('en-US/docs', 'https://developer.mozilla.org');
    expect(k.href).toBe('https://developer.mozilla.org/en-US/docs');
  });

  it('should handle URLs with no base', () => {
    const url = new URL('https://example.com');
    expect(url.href).toBe('https://example.com/');
    expect(url.hash).toBe('');
    expect(url.host).toBe('example.com');
    expect(url.hostname).toBe('example.com');
    expect(url.origin).toBe('https://example.com');
    expect(url.password).toBe('');
    expect(url.pathname).toBe('/');
    expect(url.port).toBe('');
    expect(url.protocol).toBe('https:');
    expect(url.search).toBe('');
    expect(url.username).toBe('');
  });

  it('should return correct protocol', () => {
    const url = new URL('https://example.com');
    expect(url.protocol).toBe('https:');
  });

  it('should return correct host', () => {
    const url = new URL('https://example.com:8080/path');
    expect(url.host).toBe('example.com:8080');
  });

  it('should return correct hostname', () => {
    const url = new URL('https://example.com:8080/path');
    expect(url.hostname).toBe('example.com');
  });

  it('should return correct port', () => {
    const url = new URL('https://example.com:8080/path');
    expect(url.port).toBe('8080');
  });

  it('should return correct pathname', () => {
    const url = new URL('https://example.com/path/name');
    expect(url.pathname).toBe('/path/name');
  });

  it('should return correct search', () => {
    const url = new URL('https://example.com/path?query=123');
    expect(url.search).toBe('?query=123');
  });

  it('should return correct hash', () => {
    const url = new URL('https://example.com/path#section');
    expect(url.hash).toBe('#section');
  });

  it('should return correct href', () => {
    const url = new URL('https://example.com/path');
    expect(url.href).toBe('https://example.com/path');
  });

  it('should return correct origin', () => {
    const url = new URL('https://example.com/path');
    expect(url.origin).toBe('https://example.com');
  });

  it('should return correct username', () => {
    const url = new URL('https://user:pass@example.com/path');
    expect(url.username).toBe('user');
  });

  it('should return correct password', () => {
    const url = new URL('https://user:pass@example.com/path');
    expect(url.password).toBe('pass');
  });

  it('should handle URLs with special characters', () => {
    const url = new URL('https://example.com/path with spaces');
    expect(url.href).toBe('https://example.com/path%20with%20spaces');
  });

  it('should handle URLs with unicode characters', () => {
    const url = new URL('https://example.com/路径');
    expect(url.href).toBe('https://example.com/%E8%B7%AF%E5%BE%84');
  });

  it('should handle relative URLs with ..', () => {
    const base = new URL('https://example.com/path/subpath');
    const url = new URL('../up', base);
    expect(url.href).toBe('https://example.com/up');
  });

  it('should handle relative URLs with ./', () => {
    const base = new URL('https://example.com/path/subpath');
    const url = new URL('./next', base);
    expect(url.href).toBe('https://example.com/path/next');
  });

  it('should handle empty paths', () => {
    const url = new URL('https://example.com');
    expect(url.pathname).toBe('/');
  });

  it('should handle URLs with multiple query parameters', () => {
    const url = new URL('https://example.com/path?query1=123&query2=456');
    expect(url.search).toBe('?query1=123&query2=456');
  });

  it('should handle URLs with fragment identifiers', () => {
    const url = new URL('https://example.com/path#section');
    expect(url.hash).toBe('#section');
  });

  it('should handle URLs with authentication', () => {
    const url = new URL('https://user:password@example.com');
    expect(url.username).toBe('user');
    expect(url.password).toBe('password');
  });
});
