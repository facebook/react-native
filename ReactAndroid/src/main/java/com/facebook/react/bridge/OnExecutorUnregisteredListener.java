/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

/**
 * Interface for a module that will be notified when JS executors have been unregistered from the bridge.
 * Note that this will NOT notify listeners about the main executor being destroyed: use
 * {@link NativeModule#onCatalystInstanceDestroy()} for that. Once a module has received a
 * {@link NativeModule#onCatalystInstanceDestroy()} call, it will not receive any onExecutorUnregistered
 * calls.
 */
public interface OnExecutorUnregisteredListener {

  void onExecutorDestroyed(ExecutorToken executorToken);
}
