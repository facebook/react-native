/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

jest.mock('../../BatchedBridge/NativeModules', () => ({
  __esModule: true,
  default: {
    BlobModule: require('../__mocks__/BlobModule').default,
  },
}));

const Blob = require('../Blob').default;
const BlobManager = require('../BlobManager').default;

describe('BlobManager', function () {
  it('should create blob from parts', () => {
    const blob = BlobManager.createFromParts([], {
      lastModified: 0,
      type: 'text/html',
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/html');
  });
});
