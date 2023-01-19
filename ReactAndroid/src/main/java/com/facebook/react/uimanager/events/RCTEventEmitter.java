/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

/** Deprecated in favor of RCTModernEventEmitter, which extends this interface. */
@DoNotStrip
@Deprecated
public interface RCTEventEmitter extends JavaScriptModule {
  /**
   * Deprecated in favor of RCTModernEventEmitter.receiveEvent.
   *
   * @param targetReactTag react tag of the view that receives the event
   * @param eventName name of event
   * @param event event params
   */
  @Deprecated
  void receiveEvent(int targetReactTag, String eventName, @Nullable WritableMap event);

  /**
   * Receive and process touches
   *
   * @param eventName JS event name
   * @param touches active pointers data
   * @param changedIndices indices of changed pointers
   */
  void receiveTouches(String eventName, WritableArray touches, WritableArray changedIndices);
}
