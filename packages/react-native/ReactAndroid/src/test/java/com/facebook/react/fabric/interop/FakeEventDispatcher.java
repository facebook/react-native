/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.interop;

import com.facebook.react.uimanager.events.BatchEventDispatchedListener;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.EventDispatcherListener;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.facebook.react.uimanager.events.RCTModernEventEmitter;
import java.util.ArrayList;
import java.util.List;

@SuppressWarnings("rawtypes")
public class FakeEventDispatcher implements EventDispatcher {

  List<Event> recordedDispatchedEvents = new ArrayList<>();

  @Override
  public void dispatchEvent(Event event) {
    recordedDispatchedEvents.add(event);
  }

  @Override
  public void dispatchAllEvents() {}

  @Override
  public void addListener(EventDispatcherListener listener) {}

  @Override
  public void removeListener(EventDispatcherListener listener) {}

  @Override
  public void addBatchEventDispatchedListener(BatchEventDispatchedListener listener) {}

  @Override
  public void removeBatchEventDispatchedListener(BatchEventDispatchedListener listener) {}

  @Override
  public void registerEventEmitter(int uiManagerType, RCTEventEmitter eventEmitter) {}

  @Override
  public void registerEventEmitter(int uiManagerType, RCTModernEventEmitter eventEmitter) {}

  @Override
  public void unregisterEventEmitter(int uiManagerType) {}

  @Override
  public void onCatalystInstanceDestroyed() {}
}
