/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.queue;

import java.util.Map;

import android.os.Looper;

import com.facebook.react.common.MapBuilder;

/**
 * Specifies which {@link MessageQueueThread}s must be used to run the various contexts of
 * execution within catalyst (Main UI thread, native modules, and JS). Some of these queues *may* be
 * the same but should be coded against as if they are different.
 *
 * UI Queue Thread: The standard Android main UI thread and Looper. Not configurable.
 * Native Modules Queue Thread: The thread and Looper that native modules are invoked on.
 * JS Queue Thread: The thread and Looper that JS is executed on.
 */
public class CatalystQueueConfiguration {

  private final MessageQueueThread mUIQueueThread;
  private final MessageQueueThread mNativeModulesQueueThread;
  private final MessageQueueThread mJSQueueThread;

  private CatalystQueueConfiguration(
      MessageQueueThread uiQueueThread,
      MessageQueueThread nativeModulesQueueThread,
      MessageQueueThread jsQueueThread) {
    mUIQueueThread = uiQueueThread;
    mNativeModulesQueueThread = nativeModulesQueueThread;
    mJSQueueThread = jsQueueThread;
  }

  public MessageQueueThread getUIQueueThread() {
    return mUIQueueThread;
  }

  public MessageQueueThread getNativeModulesQueueThread() {
    return mNativeModulesQueueThread;
  }

  public MessageQueueThread getJSQueueThread() {
    return mJSQueueThread;
  }

  /**
   * Should be called when the corresponding {@link com.facebook.react.bridge.CatalystInstance}
   * is destroyed so that we shut down the proper queue threads.
   */
  public void destroy() {
    if (mNativeModulesQueueThread.getLooper() != Looper.getMainLooper()) {
      mNativeModulesQueueThread.quitSynchronous();
    }
    if (mJSQueueThread.getLooper() != Looper.getMainLooper()) {
      mJSQueueThread.quitSynchronous();
    }
  }

  public static CatalystQueueConfiguration create(
      CatalystQueueConfigurationSpec spec,
      QueueThreadExceptionHandler exceptionHandler) {
    Map<MessageQueueThreadSpec, MessageQueueThread> specsToThreads = MapBuilder.newHashMap();

    MessageQueueThreadSpec uiThreadSpec = MessageQueueThreadSpec.mainThreadSpec();
    MessageQueueThread uiThread = MessageQueueThread.create( uiThreadSpec, exceptionHandler);
    specsToThreads.put(uiThreadSpec, uiThread);

    MessageQueueThread jsThread = specsToThreads.get(spec.getJSQueueThreadSpec());
    if (jsThread == null) {
      jsThread = MessageQueueThread.create(spec.getJSQueueThreadSpec(), exceptionHandler);
    }

    MessageQueueThread nativeModulesThread =
        specsToThreads.get(spec.getNativeModulesQueueThreadSpec());
    if (nativeModulesThread == null) {
      nativeModulesThread =
          MessageQueueThread.create(spec.getNativeModulesQueueThreadSpec(), exceptionHandler);
    }

    return new CatalystQueueConfiguration(uiThread, nativeModulesThread, jsThread);
  }
}
