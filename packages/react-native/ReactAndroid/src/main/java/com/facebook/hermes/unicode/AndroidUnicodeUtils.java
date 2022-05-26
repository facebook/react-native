/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.unicode;

import com.facebook.proguard.annotations.DoNotStrip;
import java.text.Collator;
import java.text.DateFormat;
import java.text.Normalizer;
import java.util.Locale;

// TODO: use com.facebook.common.locale.Locales.getApplicationLocale() as the current locale,
// rather than the device locale. This is challenging because getApplicationLocale() is only
// available via DI.
@DoNotStrip
public class AndroidUnicodeUtils {
  @DoNotStrip
  public static int localeCompare(String left, String right) {
    Collator collator = Collator.getInstance();
    return collator.compare(left, right);
  }

  @DoNotStrip
  public static String dateFormat(double unixtimeMs, boolean formatDate, boolean formatTime) {
    DateFormat format;
    if (formatDate && formatTime) {
      format = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.MEDIUM);
    } else if (formatDate) {
      format = DateFormat.getDateInstance(DateFormat.MEDIUM);
    } else if (formatTime) {
      format = DateFormat.getTimeInstance(DateFormat.MEDIUM);
    } else {
      throw new RuntimeException("Bad dateFormat configuration");
    }
    return format.format((long) unixtimeMs).toString();
  }

  @DoNotStrip
  public static String convertToCase(String input, int targetCase, boolean useCurrentLocale) {
    // These values must match CaseConversion in PlatformUnicode.h
    final int targetUppercase = 0;
    final int targetLowercase = 1;
    // Note Java's case conversions use the user's locale. For example "I".toLowerCase()
    // will produce a dotless i. From Java's docs: "To obtain correct results for locale
    // insensitive strings, use toLowerCase(Locale.ENGLISH)."
    Locale locale = useCurrentLocale ? Locale.getDefault() : Locale.ENGLISH;
    switch (targetCase) {
      case targetLowercase:
        return input.toLowerCase(locale);
      case targetUppercase:
        return input.toUpperCase(locale);
      default:
        throw new RuntimeException("Invalid target case");
    }
  }

  @DoNotStrip
  public static String normalize(String input, int form) {
    // Values must match NormalizationForm in PlatformUnicode.h.
    final int formC = 0;
    final int formD = 1;
    final int formKC = 2;
    final int formKD = 3;

    switch (form) {
      case formC:
        return Normalizer.normalize(input, Normalizer.Form.NFC);
      case formD:
        return Normalizer.normalize(input, Normalizer.Form.NFD);
      case formKC:
        return Normalizer.normalize(input, Normalizer.Form.NFKC);
      case formKD:
        return Normalizer.normalize(input, Normalizer.Form.NFKD);
      default:
        throw new RuntimeException("Invalid form");
    }
  }
}
