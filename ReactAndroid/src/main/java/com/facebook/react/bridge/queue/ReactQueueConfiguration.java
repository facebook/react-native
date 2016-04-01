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
 * Specifies which {@link MessageQueueThread}s must be used to run the various contexts of
 * execution within catalyst (Main UI thread, native modules, and JS). Some of these queues *may* be
 * the same but should be coded against as if they are different.
 *
 * UI Queue Thread: The standard Android main UI thread and Looper. Not configurable.
 * Native Modules Queue Thread: The thread and Looper that native modules are invoked on.
 * JS Queue Thread: The thread and Looper that JS is executed on.
 */
public interface ReactQueueConfiguration {
  MessageQueueThread getUIQueueThread();
  MessageQueueThread getNativeModulesQueueThread();
  MessageQueueThread getJSQueueThread();
}
