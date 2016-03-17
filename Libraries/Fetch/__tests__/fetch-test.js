/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.dontMock('fetch');
const fetch = require('fetch').fetch;

// Let fetch pick up a XMLHttpRequest mock from global scope
global.XMLHttpRequest = jest.fn();

describe('fetch', () => {
  it('should only set XMLHttpRequest timeout if set in options', () => {
    const url = 'http://foobar/';

    fetch(url).then(() => {}, () => {});
    jest.runAllTicks();
    expect(XMLHttpRequest.mock.instances.length).toBe(1);
    expect(XMLHttpRequest.mock.instances[0].timeout).toBeUndefined();

    XMLHttpRequest.mockClear();

    fetch(url, {timeout: 42}).then(() => {}, () => {});
    jest.runAllTicks();
    expect(XMLHttpRequest.mock.instances.length).toBe(1);
    expect(XMLHttpRequest.mock.instances[0].timeout).toBe(42);
  });
});
