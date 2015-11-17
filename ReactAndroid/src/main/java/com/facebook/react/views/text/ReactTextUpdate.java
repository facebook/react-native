/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.text;

import android.text.Spannable;

/**
 * Class that contains the data needed for a text update.
 * Used by both <Text/> and <TextInput/>
 * VisibleForTesting from {@link TextInputEventsTestCase}.
 */
public class ReactTextUpdate {

  private final Spannable mText;
  private final int mJsEventCounter;
  private final boolean mContainsImages;

  public ReactTextUpdate(Spannable text, int jsEventCounter, boolean containsImages) {
    mText = text;
    mJsEventCounter = jsEventCounter;
    mContainsImages = containsImages;
  }

  public Spannable getText() {
    return mText;
  }

  public int getJsEventCounter() {
    return mJsEventCounter;
  }

  public boolean containsImages() {
    return mContainsImages;
  }
}
