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

jest.setMock('../../BatchedBridge/NativeModules', {
  BlobModule: require('../__mocks__/BlobModule'),
});

const Blob = require('../Blob');
const BlobManager = require('../BlobManager');

describe('BlobManager', function () {
  it('should create blob from parts', () => {
    const blob = BlobManager.createFromParts([], {type: 'text/html'});
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/html');
  });
});
