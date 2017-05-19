/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

jest.disableAutomock();

const MapWithDefaults = require('../MapWithDefaults');

describe('MapWithDefaults', function() {
  it('works', () => {
    const map = new MapWithDefaults(() => ['bar']);
    map.get('foo').push('baz');
    expect(map.get('foo')).toEqual(['bar', 'baz']);
  });
});
