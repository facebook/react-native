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
const URLSearchParams = require('../URL').URLSearchParams;

describe('URLSearchParams', () => {
  it('should construct URLSearchParams from a string', () => {
    const a = new URLSearchParams('key1=value1&key2=value2');
    expect(a.get('key1')).toBe('value1');
    expect(a.get('key2')).toBe('value2');
    expect(a.toString()).toBe('key1=value1&key2=value2');

    const b = new URLSearchParams('?key1=value1&key2=value2');
    expect(b.get('key1')).toBe('value1');
    expect(b.get('key2')).toBe('value2');
    expect(b.toString()).toBe('key1=value1&key2=value2');
  });

  it('should construct URLSearchParams from an object', () => {
    const params = new URLSearchParams({
      key1: 'value1',
      key2: ['value2', 'value3'],
      key3: undefined,
    });

    expect(params.get('key1')).toBe('value1');
    expect(params.getAll('key2')).toEqual(['value2', 'value3']);
    expect(params.get('key3')).toBeNull();
    expect(params.toString()).toBe('key1=value1&key2=value2&key2=value3&key3=');
  });

  it('should set, append and delete parameters', () => {
    const params = new URLSearchParams('key1=value1');
    expect(params.toString()).toBe('key1=value1');

    params.append('key1', 'value1');
    expect(params.toString()).toBe('key1=value1&key1=value1');

    params.set('key1', 'somevalue');
    expect(params.toString()).toBe('key1=somevalue');

    params.delete('key1');
    expect(params.toString()).toBe('');
  });

  it('should handle URL parameter encoding and decoding', () => {
    const params = new URLSearchParams();

    params.append('key 1', 'value 1');
    params.append('key@2', 'value&2');

    expect(params.get('key 1')).toBe('value 1');
    expect(params.get('key@2')).toBe('value&2');

    expect(params.toString()).toBe('key%201=value%201&key%402=value%262');
  });
});

describe('URL', function () {
  it('should construct a valid URL object', () => {
    const url = new URL(
      'https://www.example.com:8080/path/to/resource?query=param#hash',
    );

    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('www.example.com');
    expect(url.port).toBe('8080');
    expect(url.pathname).toBe('/path/to/resource');
    expect(url.search).toBe('query=param');
    expect(url.hash).toBe('#hash');
    expect(url.href).toBe(
      'https://www.example.com:8080/path/to/resource?query=param#hash',
    );
  });

  it('should throw TypeError for an invalid URL', () => {
    expect(() => new URL(' invalid-url ')).toThrow(TypeError);
  });

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
    const g = new URL(
      '/en-US/docs',
      'https://developer.mozilla.org/fr-FR/toto',
    );
    expect(g.href).toBe('https://developer.mozilla.org/en-US/docs');

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
});
