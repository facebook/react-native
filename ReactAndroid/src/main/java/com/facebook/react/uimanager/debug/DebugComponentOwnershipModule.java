/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager.debug;

import javax.annotation.Nullable;

import android.util.SparseArray;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;

/**
 * Native module that can asynchronously request the owners hierarchy of a react tag.
 *
 * Example returned owner hierarchy: ['RootView', 'Dialog', 'TitleView', 'Text']
 */
public class DebugComponentOwnershipModule extends ReactContextBaseJavaModule {

  public interface RCTDebugComponentOwnership extends JavaScriptModule {

    void getOwnerHierarchy(int requestID, int tag);
  }

  /**
   * Callback for when we receive the ownership hierarchy in native code.
   *
   * NB: {@link #onOwnerHierarchyLoaded} will be called on the native modules thread!
   */
  public static interface OwnerHierarchyCallback {

    void onOwnerHierarchyLoaded(int tag, @Nullable ReadableArray owners);
  }

  private final SparseArray<OwnerHierarchyCallback> mRequestIdToCallback = new SparseArray<>();

  private @Nullable RCTDebugComponentOwnership mRCTDebugComponentOwnership;
  private int mNextRequestId = 0;

  public DebugComponentOwnershipModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public void initialize() {
    super.initialize();
    mRCTDebugComponentOwnership = getReactApplicationContext().
        getJSModule(RCTDebugComponentOwnership.class);
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    mRCTDebugComponentOwnership = null;
  }

  @ReactMethod
  public synchronized void receiveOwnershipHierarchy(
      int requestId,
      int tag,
      @Nullable ReadableArray owners) {
    OwnerHierarchyCallback callback = mRequestIdToCallback.get(requestId);
    if (callback == null) {
      throw new JSApplicationCausedNativeException(
          "Got receiveOwnershipHierarchy for invalid request id: " + requestId);
    }
    mRequestIdToCallback.delete(requestId);
    callback.onOwnerHierarchyLoaded(tag, owners);
  }

  /**
   * Request to receive the component hierarchy for a particular tag.
   *
   * Example returned owner hierarchy: ['RootView', 'Dialog', 'TitleView', 'Text']
   *
   * NB: The callback provided will be invoked on the native modules thread!
   */
  public synchronized void loadComponentOwnerHierarchy(int tag, OwnerHierarchyCallback callback) {
    int requestId = mNextRequestId;
    mNextRequestId++;
    mRequestIdToCallback.put(requestId, callback);
    Assertions.assertNotNull(mRCTDebugComponentOwnership).getOwnerHierarchy(requestId, tag);
  }

  @Override
  public String getName() {
    return "DebugComponentOwnershipModule";
  }
}
