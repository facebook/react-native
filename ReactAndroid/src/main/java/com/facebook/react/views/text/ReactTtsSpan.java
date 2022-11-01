/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.os.Parcel;
import android.os.PersistableBundle;
import android.text.style.TtsSpan;

/*
 * Wraps {@link BackgroundColorSpan} as a {@link ReactSpan}.
 */
public class ReactTtsSpan extends TtsSpan implements ReactSpan {
  public ReactTtsSpan(String type, PersistableBundle args) {
    super(type, args);
  }

  public ReactTtsSpan(Parcel src) {
    super(src);
  }

  public static class Builder<C extends Builder<?>> {
    private final String mType;
    private PersistableBundle mArgs = new PersistableBundle();

    public Builder(String type) {
      if (type == "verbatim") {
        mType = TYPE_VERBATIM;
      } else {
        mType = TYPE_TEXT;
      }
    }

    public ReactTtsSpan build() {
      return new ReactTtsSpan(mType, mArgs);
    }
  }
}
