/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.views.textinput;

import android.text.Spanned;

/**
 * Class that contains the data needed for a Text Input text update.
 * VisibleForTesting from {@link TextInputEventsTestCase}.
 */
public class ReactTextUpdate {

  private final Spanned mText;
  private final int mJsEventCounter;

  public ReactTextUpdate(Spanned text, int jsEventCounter) {
    mText = text;
    mJsEventCounter = jsEventCounter;
  }

  public Spanned getText() {
    return mText;
  }

  public int getJsEventCounter() {
    return mJsEventCounter;
  }
}
