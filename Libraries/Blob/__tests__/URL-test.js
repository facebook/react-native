/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */
'use strict';

const URL = require('../URL').URL;

describe('URL', function() {
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
    const g = new URL(
      '/en-US/docs',
      'https://developer.mozilla.org/fr-FR/toto',
    );
    expect(g.href).toBe('https://developer.mozilla.org/en-US/docs');
    const h = new URL('/en-US/docs', a);
    expect(h.href).toBe('https://developer.mozilla.org/en-US/docs');
  });

  it('should pass WHATWG spec examples', () => {
    const a = new URL('https:example.org');
    expect(a.href).toBe('https://example.org/');
    const b = new URL('https://////example.com///');
    expect(b.href).toBe('https://example.com///');
    const c = new URL('https://example.com/././foo');
    expect(c.href).toBe('https://example.com/foo');
    const d = new URL('hello:world', 'https://example.com/');
    expect(d.href).toBe('hello:world');
    const e = new URL('https:example.org', 'https://example.com/');
    expect(e.href).toBe('https://example.com/example.org');
    const f = new URL('\\example\\..\\demo/.\\', 'https://example.com/');
    expect(f.href).toBe('https://example.com/demo/');
    const g = new URL('example', 'https://example.com/demo');
    expect(g.href).toBe('https://example.com/example');
  });

  it('should support unicode', () => {
    const a = new URL('https://r3---sn-p5qlsnz6.googlevideo.com');
    expect(a.href).toBe('https://r3---sn-p5qlsnz6.googlevideo.com/');
  });

  // https://github.com/facebook/react-native/issues/25717
  it('should pass issue #25717 example', () => {
    const a = new URL('about', 'https://www.mozilla.org');
    expect(a.href).toBe('https://www.mozilla.org/about');

    const b = new URL('dev', 'https://google.dev');
    expect(b.href).toBe('https://google.dev/dev');
  });

  // https://github.com/facebook/react-native/issues/24428
  it('should pass issue #24428 example', () => {
    const url = new URL(
      'https://facebook.github.io/react-native/img/header_logo.png',
    );
    expect(url.href).toBe(
      'https://facebook.github.io/react-native/img/header_logo.png',
    );
  });
});
