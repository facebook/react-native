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
 * Interface for a class that knows how to handle an Exception thrown by a native module invoked
 * from JS. Since these Exceptions are triggered by JS calls (and can be fixed in JS), a
 * common way to handle one is to show a error dialog and allow the developer to change and reload
 * JS.
 *
 * We should also note that we have a unique stance on what 'caused' means: even if there's a bug in
 * the framework/native code, it was triggered by JS and theoretically since we were able to set up
 * the bridge, JS could change its logic, reload, and not trigger that crash.
 */
public interface NativeModuleCallExceptionHandler {

  /**
   * Do something to display or log the exception.
   */
  void handleException(Exception e);
}
