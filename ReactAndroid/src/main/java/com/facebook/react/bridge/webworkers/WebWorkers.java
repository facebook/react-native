/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge.webworkers;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.MessageQueueThreadImpl;
import com.facebook.react.bridge.queue.ProxyQueueThreadExceptionHandler;

@DoNotStrip
public class WebWorkers {

  /**
   * Creates a new MessageQueueThread for a background web worker owned by the JS thread with the
   * given MessageQueueThread.
   */
  public static MessageQueueThread createWebWorkerThread(int id, MessageQueueThread ownerThread) {
    return MessageQueueThreadImpl.startNewBackgroundThread(
        "web-worker-" + id,
        new ProxyQueueThreadExceptionHandler(ownerThread));
  }
}
