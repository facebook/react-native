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

  private static final String REACT_NATIVE_LIB = "reactnativejni";
  private static final String XREACT_NATIVE_LIB = "reactnativejnifb";

  static {
    staticInit();
  }

  private final ReactCallback mCallback;
  private final JavaScriptExecutor mJSExecutor;
  private final MessageQueueThread mNativeModulesQueueThread;

  public static void staticInit() {
    SoLoader.loadLibrary(REACT_NATIVE_LIB);
    SoLoader.loadLibrary(XREACT_NATIVE_LIB);
  }

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

  public void handleMemoryPressure(MemoryPressure level) {
    switch (level) {
      case UI_HIDDEN:
        handleMemoryPressureUiHidden();
        break;
      case MODERATE:
        handleMemoryPressureModerate();
        break;
      case CRITICAL:
        handleMemoryPressureCritical();
        break;
      default:
        throw new IllegalArgumentException("Unknown level: " + level);
    }
  }

  private native void initialize(
      JavaScriptExecutor jsExecutor,
      ReactCallback callback,
      MessageQueueThread nativeModulesQueueThread);

  /**
   * All native functions are not thread safe and appropriate queues should be used
   */
  public native void loadScriptFromAssets(AssetManager assetManager, String assetName);
  public native void loadScriptFromFile(@Nullable String fileName, @Nullable String sourceURL);
  public native void callFunction(ExecutorToken executorToken, String module, String method, NativeArray arguments, String tracingName);
  public native void invokeCallback(ExecutorToken executorToken, int callbackID, NativeArray arguments);
  public native void setGlobalVariable(String propertyName, String jsonEncodedArgument);
  public native boolean supportsProfiling();
  public native void startProfiler(String title);
  public native void stopProfiler(String title, String filename);
  public native ExecutorToken getMainExecutorToken();
  private native void handleMemoryPressureUiHidden();
  private native void handleMemoryPressureModerate();
  private native void handleMemoryPressureCritical();
  public native void destroy();

  /**
   * This method will return a long representing the underlying JSGlobalContextRef pointer or
   * 0 (representing NULL) when in Chrome debug mode, and is only useful if passed back through
   * the JNI to native code that will use it with the JavaScriptCore C API.
   * **WARNING:** This method is *experimental* and should only be used when no other option is
   * available. It will likely change in a future release!
   */
  public native long getJavaScriptContextNativePtrExperimental();
}
