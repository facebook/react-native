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

  it('should properly parse query strings', () => {
    const a = new URL('/search?q=test', 'https://google.com');
    expect(a.href).toBe('https://google.com/search?q=test');
    expect([...a.searchParams].length).toBe(1);
    const b = new URL('https://google.com/search?q=test');
    expect(b.href).toBe('https://google.com/search?q=test');
    expect([...b.searchParams].length).toBe(1);
    const c = new URL('https://google.com/search?q=test&utm=facebook');
    expect(c.href).toBe('https://google.com/search?q=test&utm=facebook');
    expect([...c.searchParams].length).toBe(2);
    const d = new URL('https://google.com/search?q=test');
    d.searchParams.append('utm', 'facebook');
    expect(d.href).toBe('https://google.com/search?q=test&utm=facebook');
    expect([...d.searchParams].length).toBe(2);
    const e = new URL('https://google.com/search?q');
    expect(e.href).toBe('https://google.com/search?q=');
    expect([...e.searchParams].length).toBe(1);
    const f = new URL('https://google.com/search?q=test&');
    expect(f.href).toBe('https://google.com/search?q=test');
    expect([...f.searchParams].length).toBe(1);
    const g = new URL('https://google.com/search?q=test=again');
    expect(g.href).toBe('https://google.com/search?q=test=again');
    expect([...g.searchParams].length).toBe(1);
  });
});
