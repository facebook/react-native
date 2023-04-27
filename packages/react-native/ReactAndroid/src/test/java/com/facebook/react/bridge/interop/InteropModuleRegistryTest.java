/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.interop;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.modules.core.JSTimers;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import org.junit.Before;
import org.junit.Test;

public class InteropModuleRegistryTest {

  InteropModuleRegistry underTest;

  @Before
  public void setup() {
    underTest = new InteropModuleRegistry();
  }

  @Test
  public void shouldReturnInteropModule_withFabricDisabled_returnsFalse() {
    ReactFeatureFlags.enableFabricRenderer = false;

    assertFalse(underTest.shouldReturnInteropModule(RCTEventEmitter.class));
  }

  @Test
  public void shouldReturnInteropModule_withFabricInteropDisabled_returnsFalse() {
    ReactFeatureFlags.enableFabricRenderer = true;
    ReactFeatureFlags.unstable_useFabricInterop = false;

    assertFalse(underTest.shouldReturnInteropModule(RCTEventEmitter.class));
  }

  @Test
  public void shouldReturnInteropModule_withUnregisteredClass_returnsFalse() {
    ReactFeatureFlags.enableFabricRenderer = true;
    ReactFeatureFlags.unstable_useFabricInterop = true;

    assertFalse(underTest.shouldReturnInteropModule(JSTimers.class));
  }

  @Test
  public void shouldReturnInteropModule_withRegisteredClass_returnsTrue() {
    ReactFeatureFlags.enableFabricRenderer = true;
    ReactFeatureFlags.unstable_useFabricInterop = true;

    underTest.registerInteropModule(RCTEventEmitter.class, new FakeRCTEventEmitter());

    assertTrue(underTest.shouldReturnInteropModule(RCTEventEmitter.class));
  }

  @Test
  public void getInteropModule_withRegisteredClassAndInvalidFlags_returnsNull() {
    ReactFeatureFlags.enableFabricRenderer = false;
    ReactFeatureFlags.unstable_useFabricInterop = false;
    underTest.registerInteropModule(RCTEventEmitter.class, new FakeRCTEventEmitter());

    RCTEventEmitter interopModule = underTest.getInteropModule(RCTEventEmitter.class);

    assertNull(interopModule);
  }

  @Test
  public void getInteropModule_withRegisteredClassAndValidFlags_returnsInteropModule() {
    ReactFeatureFlags.enableFabricRenderer = true;
    ReactFeatureFlags.unstable_useFabricInterop = true;
    underTest.registerInteropModule(RCTEventEmitter.class, new FakeRCTEventEmitter());

    RCTEventEmitter interopModule = underTest.getInteropModule(RCTEventEmitter.class);

    assertTrue(interopModule instanceof FakeRCTEventEmitter);
  }

  @Test
  public void getInteropModule_withUnregisteredClass_returnsNull() {
    ReactFeatureFlags.enableFabricRenderer = true;
    ReactFeatureFlags.unstable_useFabricInterop = true;
    JSTimers missingModule = underTest.getInteropModule(JSTimers.class);

    assertNull(missingModule);
  }
}
