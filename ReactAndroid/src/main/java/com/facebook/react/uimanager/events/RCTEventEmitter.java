/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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
   * @param targetTag
   * @param eventName
   * @param event
   */
  @Deprecated
  void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event);

  /**
   * Receive and process touches
   *
   * @param eventName JS event name
   * @param touches active pointers data
   * @param changedIndices indices of changed pointers
   */
  void receiveTouches(String eventName, WritableArray touches, WritableArray changedIndices);
}
