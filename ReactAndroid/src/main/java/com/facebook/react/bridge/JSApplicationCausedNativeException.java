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

/**
 * A special RuntimeException that should be thrown by native code if it has reached an exceptional
 * state due to a, or a sequence of, bad commands.
 *
 * A good rule of thumb for whether a native Exception should extend this interface is 1) Can a
 * developer make a change or correction in JS to keep this Exception from being thrown? 2) Is the
 * app outside of this catalyst instance still in a good state to allow reloading and restarting
 * this catalyst instance?
 *
 * Examples where this class is appropriate to throw:
 *  - JS tries to update a view with a tag that hasn't been created yet
 *  - JS tries to show a static image that isn't in resources
 *  - JS tries to use an unsupported view class
 *
 * Examples where this class **isn't** appropriate to throw:
 *  - Failed to write to localStorage because disk is full
 *  - Assertions about internal state (e.g. that child.getParent().indexOf(child) != -1)
 */
public class JSApplicationCausedNativeException extends RuntimeException {

  public JSApplicationCausedNativeException(String detailMessage) {
    super(detailMessage);
  }

  public JSApplicationCausedNativeException(
      @Nullable String detailMessage,
      @Nullable Throwable throwable) {
    super(detailMessage, throwable);
  }
}
