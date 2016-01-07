/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

/**
 * Instances of this class are used to place reactTag information of nested text react nodes
 * into spannable text rendered by single {@link TextView}
 */
public class ReactTagSpan {

  private final int mReactTag;

  public ReactTagSpan(int reactTag) {
    mReactTag = reactTag;
  }

  public int getReactTag() {
    return mReactTag;
  }
}
