/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

import android.content.res.AssetManager;

import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.jni.Countable;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

/**
 * Interface to the JS execution environment and means of transport for messages Java<->JS.
 */
@DoNotStrip
public class ReactBridge extends Countable {

  /* package */ static final String REACT_NATIVE_LIB = "reactnativejni";

  static {
    SoLoader.loadLibrary(REACT_NATIVE_LIB);
  }

  private final ReactCallback mCallback;
  private final JavaScriptExecutor mJSExecutor;
  private final MessageQueueThread mNativeModulesQueueThread;

  /**
   * @param jsExecutor the JS executor to use to run JS
   * @param callback the callback class used to invoke native modules
   * @param nativeModulesQueueThread the MessageQueueThread the callbacks should be invoked on
   */
  public ReactBridge(
      JavaScriptExecutor jsExecutor,
      ReactCallback callback,
      MessageQueueThread nativeModulesQueueThread) {
    mJSExecutor = jsExecutor;
    mCallback = callback;
    mNativeModulesQueueThread = nativeModulesQueueThread;
    initialize(jsExecutor, callback, mNativeModulesQueueThread);
  }

  @Override
  public void dispose() {
    mJSExecutor.close();
    mJSExecutor.dispose();
    super.dispose();
  }

  private native void initialize(
      JavaScriptExecutor jsExecutor,
      ReactCallback callback,
      MessageQueueThread nativeModulesQueueThread);

  /**
   * All native functions are not thread safe and appropriate queues should be used
   */
  public native void loadScriptFromAssets(AssetManager assetManager, String assetName);
  public native void loadScriptFromNetworkCached(String sourceURL, @Nullable String tempFileName);
  public native void callFunction(int moduleId, int methodId, NativeArray arguments);
  public native void invokeCallback(int callbackID, NativeArray arguments);
  public native void setGlobalVariable(String propertyName, String jsonEncodedArgument);
  public native boolean supportsProfiling();
  public native void startProfiler(String title);
  public native void stopProfiler(String title, String filename);
}
