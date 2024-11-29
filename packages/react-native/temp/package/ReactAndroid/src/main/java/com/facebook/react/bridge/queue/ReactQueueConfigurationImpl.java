/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

import android.os.Looper;

public class ReactQueueConfigurationImpl implements ReactQueueConfiguration {

  private final MessageQueueThreadImpl mUIQueueThread;
  private final MessageQueueThreadImpl mNativeModulesQueueThread;
  private final MessageQueueThreadImpl mJSQueueThread;

  private ReactQueueConfigurationImpl(
      MessageQueueThreadImpl uiQueueThread,
      MessageQueueThreadImpl nativeModulesQueueThread,
      MessageQueueThreadImpl jsQueueThread) {
    mUIQueueThread = uiQueueThread;
    mNativeModulesQueueThread = nativeModulesQueueThread;
    mJSQueueThread = jsQueueThread;
  }

  @Override
  public MessageQueueThread getUIQueueThread() {
    return mUIQueueThread;
  }

  @Override
  public MessageQueueThread getNativeModulesQueueThread() {
    return mNativeModulesQueueThread;
  }

  @Override
  public MessageQueueThread getJSQueueThread() {
    return mJSQueueThread;
  }

  /**
   * Should be called when the corresponding {@link com.facebook.react.bridge.CatalystInstance} is
   * destroyed so that we shut down the proper queue threads.
   */
  public void destroy() {
    if (mNativeModulesQueueThread.getLooper() != Looper.getMainLooper()) {
      mNativeModulesQueueThread.quitSynchronous();
    }
    if (mJSQueueThread.getLooper() != Looper.getMainLooper()) {
      mJSQueueThread.quitSynchronous();
    }
  }

  public static ReactQueueConfigurationImpl create(
      ReactQueueConfigurationSpec spec, QueueThreadExceptionHandler exceptionHandler) {
    MessageQueueThreadImpl uiThread =
        MessageQueueThreadImpl.create(MessageQueueThreadSpec.mainThreadSpec(), exceptionHandler);
    MessageQueueThreadImpl jsThread =
        MessageQueueThreadImpl.create(spec.getJSQueueThreadSpec(), exceptionHandler);
    MessageQueueThreadImpl nativeModulesThread =
        MessageQueueThreadImpl.create(spec.getNativeModulesQueueThreadSpec(), exceptionHandler);
    return new ReactQueueConfigurationImpl(uiThread, nativeModulesThread, jsThread);
  }
}
