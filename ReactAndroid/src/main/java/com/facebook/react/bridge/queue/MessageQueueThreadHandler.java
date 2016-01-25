/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.queue;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;

/**
 * Handler that can catch and dispatch Exceptions to an Exception handler.
 */
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
      mExceptionHandler.handleException(e);
    }
  }
}
