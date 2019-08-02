/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.views.text;

import java.text.BreakIterator;

/** Types of text transforms for CustomTextTransformSpan */
public enum TextTransform {
  NONE,
  UPPERCASE,
  LOWERCASE,
  CAPITALIZE,
  UNSET;

  public static String apply(String text, TextTransform textTransform) {
    if (text == null) {
      return null;
    }

    String transformed;
    switch (textTransform) {
      case UPPERCASE:
        transformed = text.toUpperCase();
        break;
      case LOWERCASE:
        transformed = text.toLowerCase();
        break;
      case CAPITALIZE:
        transformed = capitalize(text);
        break;
      default:
        transformed = text;
    }

    return transformed;
  }

  private static String capitalize(String text) {
    BreakIterator wordIterator = BreakIterator.getWordInstance();
    wordIterator.setText(text);

    StringBuilder res = new StringBuilder(text.length());
    int start = wordIterator.first();
    for (int end = wordIterator.next(); end != BreakIterator.DONE; end = wordIterator.next()) {
      String word = text.substring(start, end);
      if (Character.isLetterOrDigit(word.charAt(0))) {
        res.append(Character.toUpperCase(word.charAt(0)));
        res.append(word.substring(1).toLowerCase());
      } else {
        res.append(word);
      }
      start = end;
    }

    return res.toString();
  }
};
