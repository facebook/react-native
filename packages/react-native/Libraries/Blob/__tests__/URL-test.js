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
   describe('URL with search parameters', () => {
    it('should add query parameters using URLSearchParams', () => {
      const url = new URL('https://example.com');
      url.searchParams.append('name', 'test');
      url.searchParams.append('age', '30');
      expect(url.href).toBe('https://example.com/?name=test&age=30');
    });

    it('should retrieve a query parameter by name', () => {
      const url = new URL('https://example.com?name=test&age=30');
      expect(url.searchParams.get('name')).toBe('test');
      expect(url.searchParams.get('age')).toBe('30');
      expect(url.searchParams.get('nonexistent')).toBe(null);
    });

    it('should check if a query parameter exists', () => {
      const url = new URL('https://example.com?name=test&age=30');
      expect(url.searchParams.has('name')).toBe(true);
      expect(url.searchParams.has('age')).toBe(true);
      expect(url.searchParams.has('nonexistent')).toBe(false);
    });

    it('should delete a query parameter', () => {
      const url = new URL('https://example.com?name=test&age=30');
      url.searchParams.delete('age');
      expect(url.href).toBe('https://example.com/?name=test');
    });

    it('should set a query parameter, replacing existing value', () => {
      const url = new URL('https://example.com?name=test');
      url.searchParams.set('name', 'newvalue');
      expect(url.href).toBe('https://example.com/?name=newvalue');
      url.searchParams.set('age', '30');
      expect(url.href).toBe('https://example.com/?name=newvalue&age=30');
    });

    it('should retrieve all values of a query parameter', () => {
      const url = new URL('https://example.com?name=test&name=duplicate');
      expect(url.searchParams.getAll('name')).toEqual(['test', 'duplicate']);
    });

    it('should sort query parameters by name', () => {
      const url = new URL('https://example.com?b=2&a=1&c=3');
      url.searchParams.sort();
      expect(url.href).toBe('https://example.com/?a=1&b=2&c=3');
    });

    it('should convert search parameters to string', () => {
      const url = new URL('https://example.com');
      url.searchParams.append('param1', 'value1');
      url.searchParams.append('param2', 'value2');
      expect(url.searchParams.toString()).toBe('param1=value1&param2=value2');
    });
  });
});
