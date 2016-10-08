/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.queue;

/**
 * An Exception handler that posts the Exception to be thrown on the given delegate
 * MessageQueueThread.
 */
public class ProxyQueueThreadExceptionHandler implements QueueThreadExceptionHandler {

  private final MessageQueueThread mDelegateThread;

  public ProxyQueueThreadExceptionHandler(MessageQueueThread delegateThread) {
    mDelegateThread = delegateThread;
  }

  @Override
  public void handleException(final Exception e) {
    mDelegateThread.runOnQueue(
        new Runnable() {
          @Override
          public void run() {
            throw new RuntimeException(e);
          }
        });
  }
}
