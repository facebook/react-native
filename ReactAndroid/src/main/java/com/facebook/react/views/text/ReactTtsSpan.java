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
import com.facebook.common.logging.FLog;
import java.util.Currency;
import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nullable;

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
  private static final String TAG = ReactTtsSpan.class.getSimpleName();
  private static final String TYPE_MONEY_WARNING_MSG =
      "The accessibilityUnit format may not be compatible"
          + " with the format supported ISO 4217 (for example 'USD').";
  private static final String TYPE_TELEPHONE_WARNING_MSG =
      "Failed to retrieve telephone number (for example '0112123432').";
  private static final String TYPE_MEASURE_WARNING_MSG =
      "Failed to retrieve unit type (for ex. meter, second, milli).";

  public ReactTtsSpan(String type, PersistableBundle args) {
    super(type, args);
  }

  public ReactTtsSpan(Parcel src) {
    super(src);
  }

  // https://developer.android.com/reference/android/text/style/TtsSpan
  public enum AccessibilitySpan {
    CARDINAL,
    ORDINAL,
    DECIMAL,
    FRACTION,
    MEASURE,
    TIME,
    DATE,
    TELEPHONE,
    ELECTRONIC,
    MONEY,
    DIGITS,
    VERBATIM,
    NONE;

    public static String getValue(AccessibilitySpan accessibilitySpan) {
      switch (accessibilitySpan) {
        case CARDINAL:
          return ReactTtsSpan.TYPE_CARDINAL;
        case ORDINAL:
          return ReactTtsSpan.TYPE_ORDINAL;
        case DECIMAL:
          return ReactTtsSpan.TYPE_DECIMAL;
        case FRACTION:
          return ReactTtsSpan.TYPE_FRACTION;
        case MEASURE:
          return ReactTtsSpan.TYPE_MEASURE;
        case TIME:
          return ReactTtsSpan.TYPE_TIME;
        case DATE:
          return ReactTtsSpan.TYPE_DATE;
        case TELEPHONE:
          return ReactTtsSpan.TYPE_TELEPHONE;
        case ELECTRONIC:
          return ReactTtsSpan.TYPE_ELECTRONIC;
        case MONEY:
          return ReactTtsSpan.TYPE_MONEY;
        case DIGITS:
          return ReactTtsSpan.TYPE_DIGITS;
        case VERBATIM:
          return ReactTtsSpan.TYPE_VERBATIM;
        default:
          throw new IllegalArgumentException(
              "Invalid accessibility span value: " + accessibilitySpan);
      }
    }

    public static AccessibilitySpan fromValue(@androidx.annotation.Nullable String value) {
      for (AccessibilitySpan accessibilitySpan : AccessibilitySpan.values()) {
        if (accessibilitySpan.name().equalsIgnoreCase(value)) {
          return accessibilitySpan;
        }
      }
      throw new IllegalArgumentException("Invalid accessibility role value: " + value);
    }
  }

  public static class Builder<C extends Builder<?>> {
    private final String mType;
    private PersistableBundle mArgs = new PersistableBundle();

    public Builder(String type) {
      mType = type;
    }

    public Builder(AccessibilitySpan type, @Nullable String accessibilityUnit) {
      String typeConvertedToString = AccessibilitySpan.getValue(type);
      FLog.w("React::" + TAG, " typeConvertedToString: " + (typeConvertedToString));
      mType = typeConvertedToString;
      String warningMessage = "";
      Set<String> supportedTypes = new HashSet<String>();
      if (accessibilityUnit == null) {
        return;
      }
      try {
        if (type == AccessibilitySpan.MONEY) {
          warningMessage = TYPE_MONEY_WARNING_MSG;
          Currency.getInstance(accessibilityUnit);
          setStringArgument(ARG_INTEGER_PART, "");
          setStringArgument(ARG_CURRENCY, accessibilityUnit);
        }
        if (type == AccessibilitySpan.TELEPHONE) {
          warningMessage = TYPE_TELEPHONE_WARNING_MSG;
          setStringArgument(ARG_NUMBER_PARTS, accessibilityUnit);
        }
        // https://developer.android.com/reference/android/text/style/TtsSpan#ARG_UNIT
        if (type == AccessibilitySpan.MEASURE) {
          warningMessage = TYPE_MEASURE_WARNING_MSG;
          setStringArgument(ARG_UNIT, accessibilityUnit);
        }
      } catch (Exception e) {
        FLog.e(
            TAG,
            "Failed to create Builder with params type: "
                + type
                + " and accessibilityUnit: "
                + accessibilityUnit
                + " "
                + warningMessage
                + "Error: "
                + e);
      }
    }

    public ReactTtsSpan build() {
      return new ReactTtsSpan(mType, mArgs);
    }

    public C setIntArgument(String arg, int value) {
      mArgs.putInt(arg, value);
      return (C) this;
    }

    public C setStringArgument(String arg, String value) {
      mArgs.putString(arg, value);
      return (C) this;
    }
  }
}
