/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

/** Incremental counter for React Root View tag. */
public class ReactRootViewTagGenerator {

  // Keep in sync with ReactIOSTagHandles JS module - see that file for an explanation on why the
  // increment here is 10.
  private static final int ROOT_VIEW_TAG_INCREMENT = 10;

  private static int sNextRootViewTag = 1;

  public static synchronized int getNextRootViewTag() {
    final int tag = sNextRootViewTag;
    sNextRootViewTag += ROOT_VIEW_TAG_INCREMENT;
    return tag;
  }
}
