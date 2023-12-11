/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;

/** Handler that can catch and dispatch Exceptions to an Exception handler. */
public class MessageQueueThreadHandler extends Handler {

  private final QueueThreadExceptionHandler mExceptionHandler;

  public MessageQueueThreadHandler(Looper looper, QueueThreadExceptionHandler exceptionHandler) {
    super(looper);
    mExceptionHandler = exceptionHandler;
  }

  @Override
  public void dispatchMessage(Message msg) {
    try {
      super.dispatchMessage(msg);
    } catch (Exception e) {
      if (e instanceof NullPointerException) {
        FLog.e(
            ReactConstants.TAG,
            "Caught NullPointerException when dispatching message in MessageQueueThreadHandler. This is likely caused by runnable"
                + "(msg.callback) being nulled in Android Handler after dispatching and before handling (see T170239922 for more details)."
                + "Currently we observe that it only happen once which is during initialisation. Due to fixing probably involve Android "
                + "System code, we decide to ignore here for now and print an error message for debugging purpose in case this cause more serious issues in future.");
        return;
      }
      mExceptionHandler.handleException(e);
    }
  }
}
