/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.interop;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@RunWith(RobolectricTestRunner.class)
public class InteropEventEmitterTest {

  ReactContext mReactContext;
  FakeEventDispatcher mEventDispatcher;

  @Before
  public void setup() {
    mReactContext = new ReactApplicationContext(RuntimeEnvironment.application);
    mEventDispatcher = new FakeEventDispatcher();
  }

  @Test
  public void receiveEvent_dispatchesCorrectly() {
    InteropEventEmitter eventEmitter = new InteropEventEmitter(mReactContext);
    eventEmitter.overrideEventDispatcher(mEventDispatcher);

    eventEmitter.receiveEvent(42, "onTest", null);

    assertEquals(1, mEventDispatcher.recordedDispatchedEvents.size());
    assertEquals("onTest", mEventDispatcher.recordedDispatchedEvents.get(0).getEventName());
    assertEquals(InteropEvent.class, mEventDispatcher.recordedDispatchedEvents.get(0).getClass());
  }

  @Test
  public void receiveEvent_dataIsPreserved() {
    InteropEventEmitter eventEmitter = new InteropEventEmitter(mReactContext);
    eventEmitter.overrideEventDispatcher(mEventDispatcher);
    WritableMap eventData = JavaOnlyMap.of("color", "indigo");

    eventEmitter.receiveEvent(42, "onTest", eventData);

    InteropEvent event = (InteropEvent) mEventDispatcher.recordedDispatchedEvents.get(0);
    WritableMap dispatchedEventData = event.getEventData();
    assertNotNull(dispatchedEventData);
    assertEquals("indigo", dispatchedEventData.getString("color"));
  }

  @Test(expected = UnsupportedOperationException.class)
  public void receiveTouches_isNotSupported() {
    InteropEventEmitter eventEmitter = new InteropEventEmitter(mReactContext);
    eventEmitter.receiveTouches("a touch", null, null);
  }
}
