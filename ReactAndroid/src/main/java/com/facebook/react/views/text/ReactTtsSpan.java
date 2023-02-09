/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.os.PersistableBundle;
import android.text.style.TtsSpan;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;

/*
 * Used for nested Text accessibility announcements with
 * props accessiblitySpan and accessibilityLabel.
 *
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
  private static final String TYPE_TELEPHONE_WARNING_MSG =
      "Failed to retrieve telephone number (for example '0112123432').";
  private static final String TYPE_MEASURE_WARNING_MSG =
      "Failed to retrieve unit type (for ex. meter, second, milli).";

  public ReactTtsSpan(String type, PersistableBundle args) {
    super(type, args);
  }

  // https://developer.android.com/reference/android/text/style/TtsSpan
  public enum AccessibilitySpan {
    NONE,
    CARDINAL,
    ORDINAL,
    MEASURE,
    TELEPHONE,
    VERBATIM;

    public static String getValue(AccessibilitySpan accessibilitySpan) {
      switch (accessibilitySpan) {
        case CARDINAL:
          return ReactTtsSpan.TYPE_CARDINAL;
        case ORDINAL:
          return ReactTtsSpan.TYPE_ORDINAL;
        case MEASURE:
          return ReactTtsSpan.TYPE_MEASURE;
        case TELEPHONE:
          return ReactTtsSpan.TYPE_TELEPHONE;
        case VERBATIM:
          return ReactTtsSpan.TYPE_VERBATIM;
        case NONE:
          return ReactTtsSpan.TYPE_TEXT;
        default:
          throw new IllegalArgumentException(
              "Invalid accessibility span value: " + accessibilitySpan);
      }
    }

    public static AccessibilitySpan fromValue(@Nullable String value) {
      for (AccessibilitySpan accessibilitySpan : AccessibilitySpan.values()) {
        if (accessibilitySpan.name().equalsIgnoreCase(value)) {
          return accessibilitySpan;
        }
      }
      throw new IllegalArgumentException("Invalid accessibility role value: " + value);
    }
  }

  public static class Builder {
    private String mType;
    private final PersistableBundle mArgs = new PersistableBundle();

    public Builder(String type) {
      mType = type;
    }

    public Builder(AccessibilitySpan type, @Nullable String accessibilityLabel) {
      mType = AccessibilitySpan.getValue(type);
      String warningMessage = "";
      if (accessibilityLabel == null) {
        return;
      }
      try {
        /*
         * The default type used when accessibilitySpan prop is not set (AccessibilitySpan.NONE)
         * Adds the accessibilityLabel announcement on a Nested Text.
         *
         * https://developer.android.com/reference/android/text/style/TtsSpan#TYPE_TEXT
         * This span type can be used to add morphosyntactic features to the text it spans over,
         * or synthesize a something else than the spanned text.
         * Use the argument ARG_TEXT to set a different text.
         *
         * https://developer.android.com/reference/android/text/style/TtsSpan#ARG_TEXT
         * String supplying the text to be synthesized.
         * The synthesizer is free to decide how to interpret the text. Can be used with TYPE_TEXT.
         */
        if (mType.equals(TYPE_TEXT)) {
          setStringArgument(ARG_TEXT, accessibilityLabel);
        }
        /*
         * <p>Telephone refer to
         * https://developer.android.com/reference/android/text/style/TtsSpan#ARG_NUMBER_PARTS
         *
         * <p>Argument used to specify the main number part of a telephone number. Can be a string of
         * digits where the different parts of the telephone number can be separated with a space, '-',
         * '/' or '.'. Can be used with TYPE_TELEPHONE.
         */
        if (mType.equals(TYPE_TELEPHONE)) {
          warningMessage = TYPE_TELEPHONE_WARNING_MSG;
          setStringArgument(ARG_NUMBER_PARTS, accessibilityLabel);
        }
        /*
         * <p>Measure refer to
         * https://developer.android.com/reference/android/text/style/TtsSpan#ARG_UNIT
         *
         * <p>Argument used to specify the unit of a measure. The unit should always be specified in
         * English singular form. Prefixes may be used. Engines will do their best to pronounce them
         * correctly in the language used. Engines are expected to at least support the most common ones
         * like "meter", "second", "degree celsius" and "degree fahrenheit" with some common prefixes
         * like "milli" and "kilo". Can be used with TYPE_MEASURE.
         */
        if (mType.equals(TYPE_MEASURE)) {
          warningMessage = TYPE_MEASURE_WARNING_MSG;
          setStringArgument(ARG_UNIT, accessibilityLabel);
        }
        /*
         * <p>Ordinal and Cardinal
         * https://developer.android.com/reference/android/text/style/TtsSpan#ARG_NUMBER
         *
         * <p>Argument used to specify a whole number. The value can be a string of digits of any size
         * optionally prefixed with a - or +. Can be used with TYPE_CARDINAL and TYPE_ORDINAL.
         */
        if (mType.equals(TYPE_CARDINAL) || mType.equals(TYPE_ORDINAL)) {
          setStringArgument(ARG_NUMBER, accessibilityLabel);
        }
      } catch (Exception e) {
        // fallback and use accessibilityLabel as text
        if (mType != TYPE_TEXT) {
          mType = TYPE_TEXT;
          setStringArgument(ARG_TEXT, accessibilityLabel);
        }
        FLog.w(
            TAG,
            "Failed to create Builder with params type: "
                + type
                + " and accessibilityLabel: "
                + accessibilityLabel
                + " "
                + warningMessage
                + "Error: "
                + e);
      }
    }

    public ReactTtsSpan build() {
      return new ReactTtsSpan(mType, mArgs);
    }

    public void setStringArgument(String arg, String value) {
      mArgs.putString(arg, value);
    }
  }
}
