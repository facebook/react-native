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
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import java.util.Currency;
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
  // For additional logging change the below variable to true
  public static final boolean DEBUG_MODE = true;

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

    public Builder(AccessibilityRole type, @Nullable String accessibilityUnit) {
      String typeConvertedToString = AccessibilityRole.getValue(type);
      mType = typeConvertedToString;
      String roleClassName = AccessibilityRole.getValue(type);
      try {
        if (roleClassName == ReactTtsSpan.TYPE_TIME) {
          String[] time = accessibilityUnit.split(":");
          if (time[0] != null && time[1] != null) {
            Integer hours = Integer.parseInt(time[0]);
            Integer minutes = Integer.parseInt(time[1]);
            setIntArgument(ReactTtsSpan.ARG_HOURS, hours);
            setIntArgument(ReactTtsSpan.ARG_MINUTES, minutes);
          } else if (DEBUG_MODE) {
            FLog.w(
                TAG,
                "Failed to retrieve hours and minutes from accessibilityUnit: "
                    + accessibilityUnit
                    + ". Make sure the format is HH:MM");
          }
        }
      } catch (Exception e) {
        // in reactnative we trigger an error in metro on Debug
        // (for ex. accessibilityHours should be a number and not a string)
        // accessibilityUnit uses a String type, there is no strict check on the type
        // will be improved in the future upcoming PRs
        // multiple props could be added for different properties
        // accessibilityHours number, accessibilityCurrency "USD" or "EUR" ISO 4217
        // accessibilityAmount number https://bit.ly/3UG96lP
        FLog.e(
            TAG,
            "Failed to create ReactTtsSpan.Builder with params type: "
                + type
                + " and accessibilityUnit: "
                + accessibilityUnit
                + "with Error: "
                + e);
      }
      if (roleClassName == ReactTtsSpan.TYPE_MONEY) {
        try {
          String[] amount = accessibilityUnit.split(",");
          if (amount[0] != null && amount[1] != null) {
            setStringArgument(ReactTtsSpan.ARG_INTEGER_PART, amount[0]);
            String currency = amount[1].trim();
            Currency.getInstance(currency);
            setStringArgument(ReactTtsSpan.ARG_CURRENCY, currency);
          }
        } catch (Exception e) {
          FLog.e(
              TAG,
              "Failed to retrieve the currency from the accessibilityUnit: "
                  + accessibilityUnit
                  + ". The accessibilityUnit format may not be compatible"
                  + " with the format supported ISO 4217 (for example '1, USD')."
                  + "Error: "
                  + e);
        }
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
