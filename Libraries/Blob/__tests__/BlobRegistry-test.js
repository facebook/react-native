/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

describe('BlobRegistry', () => {
  let BlobRegistry;

  beforeEach(() => {
    jest.isolateModules(() => {
      BlobRegistry = require('react-native/Libraries/Blob/BlobRegistry');
    });
  });

  it('register adds a reference', () => {
    const collector = {};
    BlobRegistry.register(collector);
    expect(BlobRegistry.has(collector)).toBe(true);
  });

  it('registering the same reference multiple times requires unregistering mutliple times', () => {
    const collector = {};
    BlobRegistry.register(collector);
    BlobRegistry.register(collector);
    BlobRegistry.register(collector);
    BlobRegistry.unregister(collector);
    expect(BlobRegistry.has(collector)).toBe(true);
    BlobRegistry.unregister(collector);
    BlobRegistry.unregister(collector);
    expect(BlobRegistry.has(collector)).toBe(false);
  });

  it('has no reference for an unregistered object', () => {
    expect(BlobRegistry.has({})).toBe(false);
  });

  it('does nothing if you unregister an unregistered object', () => {
    const unknownCollector = {};
    expect(() => BlobRegistry.unregister(unknownCollector)).not.toThrow();
    expect(BlobRegistry.has(unknownCollector)).toBe(false);
  });
});
