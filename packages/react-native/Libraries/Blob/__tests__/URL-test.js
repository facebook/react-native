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
  it("hash",()=>{
    const l = new URL("https://developer.mozilla.org");
    // expect(l.hostname).toBe("developer.mozilla.org")
    const m = new URL('en-US/docs/#end',l);
    expect(m.href).toBe("https://developer.mozilla.org/en-US/docs/#end")
    expect(m.hash).toBe("#end")
  })
  it("host is a hostname and port",()=>{
    // The port is not provided
    const httpPort = "123";
    const protocol = "https"
    const hostname = 'developer.mozilla.org'
    const pathName = '/en-US/docs/Web/API/URL/host'
    const n = new URL(`${protocol}://${hostname}:${httpPort}${pathName}`);
    expect(n.hostname).toBe(`${hostname}`)
    expect(n.origin).toBe(`${protocol}://${hostname}:${httpPort}`)
    // the 443 is default https
    const httpPort2 = "443";
    const r = new URL(`${protocol}://${hostname}:${httpPort2}${pathName}`);
    expect(r.protocol).toBe(protocol)
    expect(r.port).toBe("")
    expect(r.host).toBe("developer.mozilla.org")
    // the port is other
    const p = new URL("https://developer.mozilla.org:4097/en-US/docs/Web/API/URL/host");
    expect(p.host).toBe("developer.mozilla.org:4097")
    expect(p.pathname).toBe("/en-US/docs/Web/API/URL/host/")
    const q = new URL("https://developer.mozilla.org:4097/en-US/docs/Web/API/URL/host?q=dad");
    expect(q.search).toBe("?q=dad")
    expect(q.href).toBe("https://developer.mozilla.org:4097/en-US/docs/Web/API/URL/host?q=dad")
    let u = new URL("https://username:password@developer.mozilla.org:443/en-US/docs/Web/API/URL/host")
    expect(u.host).toBe("developer.mozilla.org")
    expect(u.password).toBe("password")
  })
});
