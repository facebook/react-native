/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import {getFabricUIManager} from '../FabricUIManager';

// NOTE: The test that verifies getFabricUIManager() returns undefined when
// global.nativeFabricUIManager is not set cannot be converted to a Fantom
// integration test. That test relies on jest.resetModules() to clear the
// module-level singleton (nativeFabricUIManagerProxy). In the Fantom
// environment, global.nativeFabricUIManager is always set up by the runtime,
// and there is no module reset mechanism available. That test exercises a code
// path (getFabricUIManager returning undefined) that is not reachable in a
// fully-initialized Fantom environment.

describe('getFabricUIManager', () => {
  it('should return an object when the global binding is set in the Fantom environment', () => {
    // In the Fantom environment, global.nativeFabricUIManager is always set by
    // the native runtime, so getFabricUIManager() must return a non-null object.
    const fabricUIManager = getFabricUIManager();
    expect(fabricUIManager).not.toBeNull();
    expect(fabricUIManager).not.toBeUndefined();
    expect(typeof fabricUIManager).toBe('object');
  });

  it('should return the same object on subsequent calls', () => {
    // getFabricUIManager() caches the proxy object in a module-level variable.
    // Subsequent calls should return the same reference.
    const first = getFabricUIManager();
    const second = getFabricUIManager();
    expect(first).toBe(second);
  });

  it('should cache the createNode property so the same reference is returned each time', () => {
    // The proxy created by getFabricUIManager() uses defineLazyObjectProperty
    // to cache properties from the underlying global binding. Accessing the
    // same property twice should return the same reference even if the
    // underlying binding produces a new host function on each access.
    const fabricUIManager = getFabricUIManager();
    expect(fabricUIManager).not.toBeNull();
    expect(fabricUIManager).not.toBeUndefined();

    if (fabricUIManager != null) {
      const firstCreateNode = fabricUIManager.createNode;
      const secondCreateNode = fabricUIManager.createNode;
      expect(firstCreateNode).toBe(secondCreateNode);
    }
  });

  it('should expose the createNode method', () => {
    // Verify that the returned proxy exposes createNode as a function.
    // createNode is one of the CACHED_PROPERTIES in FabricUIManager.js and
    // is provided by the Fantom native runtime.
    const fabricUIManager = getFabricUIManager();
    expect(fabricUIManager).not.toBeNull();
    expect(fabricUIManager).not.toBeUndefined();

    if (fabricUIManager != null) {
      expect(typeof fabricUIManager.createNode).toBe('function');
    }
  });
});
