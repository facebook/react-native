/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import getBaseUrlFromRequest from '../utils/getBaseUrlFromRequest';

test('returns a base url based on req.headers.host', () => {
  expect(
    getBaseUrlFromRequest(makeRequest('localhost:8081', false))?.href,
  ).toEqual('http://localhost:8081/');
});

test('identifies https using socket.encrypted', () => {
  expect(
    getBaseUrlFromRequest(makeRequest('secure.net:8443', true))?.href,
  ).toEqual('https://secure.net:8443/');
});

test('works with ipv6 hosts', () => {
  expect(getBaseUrlFromRequest(makeRequest('[::1]:8081', false))?.href).toEqual(
    'http://[::1]:8081/',
  );
});

test('returns null on an invalid host header', () => {
  expect(getBaseUrlFromRequest(makeRequest('local[]host', false))).toBeNull();
});

test('returns null on an empty host header', () => {
  expect(getBaseUrlFromRequest(makeRequest(null, false))).toBeNull();
});

function makeRequest(
  host: ?string,
  encrypted: boolean,
): http$IncomingMessage<> | http$IncomingMessage<tls$TLSSocket> {
  // $FlowIgnore[incompatible-return] Partial mock of request
  return {
    socket: encrypted ? {encrypted: true} : {},
    headers: host != null ? {host} : {},
  };
}
