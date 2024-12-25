/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * A special RuntimeException that should be thrown by native code if it has reached an exceptional
 * state due to a, or a sequence of, bad commands.
 *
 * <p>A good rule of thumb for whether a native Exception should extend this interface is 1) Can a
 * developer make a change or correction in JS to keep this Exception from being thrown? 2) Is the
 * app outside of this catalyst instance still in a good state to allow reloading and restarting
 * this catalyst instance?
 *
 * <p>Examples where this class is appropriate to throw:
 * <ul>
 * <li>JS tries to update a view with a tag that hasn't been created yet
 * <li>JS tries to show a static image that isn't in resources
 * <li>JS tries to use an unsupported view class
 * </ul>
 *
 * <p>Examples where this class **isn't** appropriate to throw: - Failed to write to localStorage
 * because disk is full - Assertions about internal state (e.g. that
 * child.getParent().indexOf(child) != -1)
 */
public open class JSApplicationCausedNativeException : RuntimeException {
  public constructor(detailMessage: String) : super(detailMessage)

  public constructor(detailMessage: String, throwable: Throwable?) : super(detailMessage, throwable)
}
