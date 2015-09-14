/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.graphics.Color;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.common.annotations.VisibleForTesting;

/**
 * Translates the different color formats to their actual colors.
 */
public class CSSColorUtil {

  static final Pattern RGB_COLOR_PATTERN =
      Pattern.compile("rgb\\(\\s*([0-9]{1,3}),\\s*([0-9]{1,3}),\\s*([0-9]{1,3})\\s*\\)");

  static final Pattern RGBA_COLOR_PATTERN = Pattern.compile(
      "rgba\\(\\s*([0-9]{1,3}),\\s*([0-9]{1,3}),\\s*([0-9]{1,3})\\s*,\\s*(0*(\\.\\d{1,3})?|1(\\.0+)?)\\)");

  private static final HashMap<String, Integer> sColorNameMap = new HashMap<String, Integer>();

  static {
    // List of HTML4 colors: http://www.w3.org/TR/css3-color/#html4
    sColorNameMap.put("black", Color.argb(255, 0, 0, 0));
    sColorNameMap.put("silver", Color.argb(255, 192, 192, 192));
    sColorNameMap.put("gray", Color.argb(255, 128, 128, 128));
    sColorNameMap.put("grey", Color.argb(255, 128, 128, 128));
    sColorNameMap.put("white", Color.argb(255, 255, 255, 255));
    sColorNameMap.put("maroon", Color.argb(255, 128, 0, 0));
    sColorNameMap.put("red", Color.argb(255, 255, 0, 0));
    sColorNameMap.put("purple", Color.argb(255, 128, 0, 128));
    sColorNameMap.put("fuchsia", Color.argb(255, 255, 0, 255));
    sColorNameMap.put("green", Color.argb(255, 0, 128, 0));
    sColorNameMap.put("lime", Color.argb(255, 0, 255, 0));
    sColorNameMap.put("olive", Color.argb(255, 128, 128, 0));
    sColorNameMap.put("yellow", Color.argb(255, 255, 255, 0));
    sColorNameMap.put("navy", Color.argb(255, 0, 0, 128));
    sColorNameMap.put("blue", Color.argb(255, 0, 0, 255));
    sColorNameMap.put("teal", Color.argb(255, 0, 128, 128));
    sColorNameMap.put("aqua", Color.argb(255, 0, 255, 255));

    // Extended colors
    sColorNameMap.put("orange", Color.argb(255, 255, 165, 0));
    sColorNameMap.put("transparent", Color.argb(0, 0, 0, 0));
  }

  /**
   * Parses the given color string and returns the corresponding color int value.
   *
   * The following color formats are supported:
   * <ul>
   *   <li>#rgb - Example: "#F02" (will be expanded to "#FF0022")</li>
   *   <li>#rrggbb - Example: "#FF0022"</li>
   *   <li>rgb(r, g, b) - Example: "rgb(255, 0, 34)"</li>
   *   <li>rgba(r, g, b, a) - Example: "rgba(255, 0, 34, 0.2)"</li>
   *   <li>Color names - Example: "red" or "transparent"</li>
   * </ul>
   * @param colorString the string representation of the color
   * @return the color int
   */
  public static int getColor(String colorString) {
    if (colorString.startsWith("rgb(")) {
      Matcher rgbMatcher = RGB_COLOR_PATTERN.matcher(colorString);
      if (rgbMatcher.matches()) {
        return Color.rgb(
            validateColorComponent(Integer.parseInt(rgbMatcher.group(1))),
            validateColorComponent(Integer.parseInt(rgbMatcher.group(2))),
            validateColorComponent(Integer.parseInt(rgbMatcher.group(3))));
      } else {
        throw new JSApplicationIllegalArgumentException("Invalid color: " + colorString);
      }
    } else if (colorString.startsWith("rgba(")) {
      Matcher rgbaMatcher = RGBA_COLOR_PATTERN.matcher(colorString);
      if (rgbaMatcher.matches()) {
        return Color.argb(
            (int) (Float.parseFloat(rgbaMatcher.group(4)) * 255),
            validateColorComponent(Integer.parseInt(rgbaMatcher.group(1))),
            validateColorComponent(Integer.parseInt(rgbaMatcher.group(2))),
            validateColorComponent(Integer.parseInt(rgbaMatcher.group(3))));
      } else {
        throw new JSApplicationIllegalArgumentException("Invalid color: " + colorString);
      }
    } else if (colorString.startsWith("#")) {
      if (colorString.length() == 4) {
        int r = parseHexChar(colorString.charAt(1));
        int g = parseHexChar(colorString.charAt(2));
        int b = parseHexChar(colorString.charAt(3));

        // double the character
        // since parseHexChar only returns values from 0-15, we don't need & 0xff
        r = r | (r << 4);
        g = g | (g << 4);
        b = b | (b << 4);
        return Color.rgb(r, g, b);
      } else {
        // check if we have #RRGGBB
        if (colorString.length() == 7) {
          // Color.parseColor(...) can throw an IllegalArgumentException("Unknown color").
          // For consistency, we hide the original exception and throw our own exception instead.
          try {
            return Color.parseColor(colorString);
          } catch (IllegalArgumentException ex) {
            throw new JSApplicationIllegalArgumentException("Invalid color: " + colorString);
          }
        } else {
          throw new JSApplicationIllegalArgumentException("Invalid color: " + colorString);
        }
      }
    } else {
      Integer color = sColorNameMap.get(colorString.toLowerCase());
      if (color != null) {
        return color;
      }
      throw new JSApplicationIllegalArgumentException("Unknown color: " + colorString);
    }
  }

  /**
   * Convert a single hex character (0-9, a-f, A-F) to a number (0-15).
   *
   * @param hexChar the hex character to convert
   * @return the value between 0 and 15
   */
  @VisibleForTesting
  /*package*/ static int parseHexChar(char hexChar) {
    if (hexChar >= '0' && hexChar <= '9') {
      return hexChar - '0';
    } else if (hexChar >= 'A' && hexChar <= 'F') {
      return hexChar - 'A' + 10;
    } else if (hexChar >= 'a' && hexChar <= 'f') {
      return hexChar - 'a' + 10;
    }
    throw new JSApplicationIllegalArgumentException("Invalid hex character: " + hexChar);
  }

  private static int validateColorComponent(int color) {
    if (color < 0 || color > 255) {
      throw new JSApplicationIllegalArgumentException("Invalid color component: " + color);
    }
    return color;
  }

}
