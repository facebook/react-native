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
 * A span that supplies additional meta-data for the associated text intended
 * for text-to-speech engines. If the text is being processed by a
 * text-to-speech engine, the engine may use the data in this span in addition
 * to or instead of its associated text.
 *
 * Each instance of a TtsSpan has a type, for example {@link #TYPE_DATE}
 * or {@link #TYPE_MEASURE}. And a list of arguments, provided as
 * key-value pairs in a bundle.
 *
 * The inner classes are there for convenience and provide builders for each
 * TtsSpan type.
 */
public class ReactTtsSpan extends TtsSpan implements ReactSpan {

  // supported TYPES in react-native
  public static Set<String> SUPPORTED_UNIT_TYPES =
      Set.of(
          TYPE_CARDINAL,
          TYPE_ORDINAL,
          TYPE_DECIMAL,
          TYPE_FRACTION,
          TYPE_MEASURE,
          TYPE_TIME,
          TYPE_DATE,
          TYPE_TELEPHONE,
          TYPE_ELECTRONIC,
          TYPE_MONEY,
          TYPE_DIGITS,
          TYPE_VERBATIM);

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

    public C setIntArgument(String arg, int value) {
      mArgs.putInt(arg, value);
      return (C) this;
    }
  }
  /*
  public static class TimeBuilder extends SemioticClassBuilder<TimeBuilder> {

    public TimeBuilder() {
      super(TtsSpan.TYPE_TIME);
    }
  }
  */
}
