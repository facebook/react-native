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
import java.util.Set;

/*
 * Wraps {@link TtsSpan} as a {@link ReactSpan}.
 */
public class ReactTtsSpan extends TtsSpan implements ReactSpan {
  // supported TYPES in react-native
  public static Set<String> SUPPORTED_UNIT_TYPES = Set.of(TYPE_VERBATIM, TYPE_DATE);

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
      mType = type;
    }

    public ReactTtsSpan build() {
      return new ReactTtsSpan(mType, mArgs);
    }
  }
}
