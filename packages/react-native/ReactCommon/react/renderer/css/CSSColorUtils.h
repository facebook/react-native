/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/css/CSSKeywords.h>
#include <react/renderer/css/CSSValueVariant.h>
#include <optional>

namespace facebook::react {
// https://www.w3.org/TR/css-color-4/#named-colors
template <typename CSSValueT>
constexpr std::optional<CSSValueT> parseCSSNamedColor(std::string_view name) {
  switch (fnv1aLowercase(name)) {
    case fnv1a("aliceblue"):
      return CSSValueT::color(240, 248, 255, 255);
    case fnv1a("antiquewhite"):
      return CSSValueT::color(250, 235, 215, 255);
    case fnv1a("aqua"):
      return CSSValueT::color(0, 255, 255, 255);
    case fnv1a("aquamarine"):
      return CSSValueT::color(127, 255, 212, 255);
    case fnv1a("azure"):
      return CSSValueT::color(240, 255, 255, 255);
    case fnv1a("beige"):
      return CSSValueT::color(245, 245, 220, 255);
    case fnv1a("bisque"):
      return CSSValueT::color(255, 228, 196, 255);
    case fnv1a("black"):
      return CSSValueT::color(0, 0, 0, 255);
    case fnv1a("blanchedalmond"):
      return CSSValueT::color(255, 235, 205, 255);
    case fnv1a("blue"):
      return CSSValueT::color(0, 0, 255, 255);
    case fnv1a("blueviolet"):
      return CSSValueT::color(138, 43, 226, 255);
    case fnv1a("brown"):
      return CSSValueT::color(165, 42, 42, 255);
    case fnv1a("burlywood"):
      return CSSValueT::color(222, 184, 135, 255);
    case fnv1a("cadetblue"):
      return CSSValueT::color(95, 158, 160, 255);
    case fnv1a("chartreuse"):
      return CSSValueT::color(127, 255, 0, 255);
    case fnv1a("chocolate"):
      return CSSValueT::color(210, 105, 30, 255);
    case fnv1a("coral"):
      return CSSValueT::color(255, 127, 80, 255);
    case fnv1a("cornflowerblue"):
      return CSSValueT::color(100, 149, 237, 255);
    case fnv1a("cornsilk"):
      return CSSValueT::color(255, 248, 220, 255);
    case fnv1a("crimson"):
      return CSSValueT::color(220, 20, 60, 255);
    case fnv1a("cyan"):
      return CSSValueT::color(0, 255, 255, 255);
    case fnv1a("darkblue"):
      return CSSValueT::color(0, 0, 139, 255);
    case fnv1a("darkcyan"):
      return CSSValueT::color(0, 139, 139, 255);
    case fnv1a("darkgoldenrod"):
      return CSSValueT::color(184, 134, 11, 255);
    case fnv1a("darkgray"):
      return CSSValueT::color(169, 169, 169, 255);
    case fnv1a("darkgreen"):
      return CSSValueT::color(0, 100, 0, 255);
    case fnv1a("darkgrey"):
      return CSSValueT::color(169, 169, 169, 255);
    case fnv1a("darkkhaki"):
      return CSSValueT::color(189, 183, 107, 255);
    case fnv1a("darkmagenta"):
      return CSSValueT::color(139, 0, 139, 255);
    case fnv1a("darkolivegreen"):
      return CSSValueT::color(85, 107, 47, 255);
    case fnv1a("darkorange"):
      return CSSValueT::color(255, 140, 0, 255);
    case fnv1a("darkorchid"):
      return CSSValueT::color(153, 50, 204, 255);
    case fnv1a("darkred"):
      return CSSValueT::color(139, 0, 0, 255);
    case fnv1a("darksalmon"):
      return CSSValueT::color(233, 150, 122, 255);
    case fnv1a("darkseagreen"):
      return CSSValueT::color(143, 188, 143, 255);
    case fnv1a("darkslateblue"):
      return CSSValueT::color(72, 61, 139, 255);
    case fnv1a("darkslategray"):
      return CSSValueT::color(47, 79, 79, 255);
    case fnv1a("darkslategrey"):
      return CSSValueT::color(47, 79, 79, 255);
    case fnv1a("darkturquoise"):
      return CSSValueT::color(0, 206, 209, 255);
    case fnv1a("darkviolet"):
      return CSSValueT::color(148, 0, 211, 255);
    case fnv1a("deeppink"):
      return CSSValueT::color(255, 20, 147, 255);
    case fnv1a("deepskyblue"):
      return CSSValueT::color(0, 191, 255, 255);
    case fnv1a("dimgray"):
      return CSSValueT::color(105, 105, 105, 255);
    case fnv1a("dimgrey"):
      return CSSValueT::color(105, 105, 105, 255);
    case fnv1a("dodgerblue"):
      return CSSValueT::color(30, 144, 255, 255);
    case fnv1a("firebrick"):
      return CSSValueT::color(178, 34, 34, 255);
    case fnv1a("floralwhite"):
      return CSSValueT::color(255, 250, 240, 255);
    case fnv1a("forestgreen"):
      return CSSValueT::color(34, 139, 34, 255);
    case fnv1a("fuchsia"):
      return CSSValueT::color(255, 0, 255, 255);
    case fnv1a("gainsboro"):
      return CSSValueT::color(220, 220, 220, 255);
    case fnv1a("ghostwhite"):
      return CSSValueT::color(248, 248, 255, 255);
    case fnv1a("gold"):
      return CSSValueT::color(255, 215, 0, 255);
    case fnv1a("goldenrod"):
      return CSSValueT::color(218, 165, 32, 255);
    case fnv1a("gray"):
      return CSSValueT::color(128, 128, 128, 255);
    case fnv1a("green"):
      return CSSValueT::color(0, 128, 0, 255);
    case fnv1a("greenyellow"):
      return CSSValueT::color(173, 255, 47, 255);
    case fnv1a("grey"):
      return CSSValueT::color(128, 128, 128, 255);
    case fnv1a("honeydew"):
      return CSSValueT::color(240, 255, 240, 255);
    case fnv1a("hotpink"):
      return CSSValueT::color(255, 105, 180, 255);
    case fnv1a("indianred"):
      return CSSValueT::color(205, 92, 92, 255);
    case fnv1a("indigo"):
      return CSSValueT::color(75, 0, 130, 255);
    case fnv1a("ivory"):
      return CSSValueT::color(255, 255, 240, 255);
    case fnv1a("khaki"):
      return CSSValueT::color(240, 230, 140, 255);
    case fnv1a("lavender"):
      return CSSValueT::color(230, 230, 250, 255);
    case fnv1a("lavenderblush"):
      return CSSValueT::color(255, 240, 245, 255);
    case fnv1a("lawngreen"):
      return CSSValueT::color(124, 252, 0, 255);
    case fnv1a("lemonchiffon"):
      return CSSValueT::color(255, 250, 205, 255);
    case fnv1a("lightblue"):
      return CSSValueT::color(173, 216, 230, 255);
    case fnv1a("lightcoral"):
      return CSSValueT::color(240, 128, 128, 255);
    case fnv1a("lightcyan"):
      return CSSValueT::color(224, 255, 255, 255);
    case fnv1a("lightgoldenrodyellow"):
      return CSSValueT::color(250, 250, 210, 255);
    case fnv1a("lightgray"):
      return CSSValueT::color(211, 211, 211, 255);
    case fnv1a("lightgreen"):
      return CSSValueT::color(144, 238, 144, 255);
    case fnv1a("lightgrey"):
      return CSSValueT::color(211, 211, 211, 255);
    case fnv1a("lightpink"):
      return CSSValueT::color(255, 182, 193, 255);
    case fnv1a("lightsalmon"):
      return CSSValueT::color(255, 160, 122, 255);
    case fnv1a("lightseagreen"):
      return CSSValueT::color(32, 178, 170, 255);
    case fnv1a("lightskyblue"):
      return CSSValueT::color(135, 206, 250, 255);
    case fnv1a("lightslategray"):
      return CSSValueT::color(119, 136, 153, 255);
    case fnv1a("lightslategrey"):
      return CSSValueT::color(119, 136, 153, 255);
    case fnv1a("lightsteelblue"):
      return CSSValueT::color(176, 196, 222, 255);
    case fnv1a("lightyellow"):
      return CSSValueT::color(255, 255, 224, 255);
    case fnv1a("lime"):
      return CSSValueT::color(0, 255, 0, 255);
    case fnv1a("limegreen"):
      return CSSValueT::color(50, 205, 50, 255);
    case fnv1a("linen"):
      return CSSValueT::color(250, 240, 230, 255);
    case fnv1a("magenta"):
      return CSSValueT::color(255, 0, 255, 255);
    case fnv1a("maroon"):
      return CSSValueT::color(128, 0, 0, 255);
    case fnv1a("mediumaquamarine"):
      return CSSValueT::color(102, 205, 170, 255);
    case fnv1a("mediumblue"):
      return CSSValueT::color(0, 0, 205, 255);
    case fnv1a("mediumorchid"):
      return CSSValueT::color(186, 85, 211, 255);
    case fnv1a("mediumpurple"):
      return CSSValueT::color(147, 112, 219, 255);
    case fnv1a("mediumseagreen"):
      return CSSValueT::color(60, 179, 113, 255);
    case fnv1a("mediumslateblue"):
      return CSSValueT::color(123, 104, 238, 255);
    case fnv1a("mediumspringgreen"):
      return CSSValueT::color(0, 250, 154, 255);
    case fnv1a("mediumturquoise"):
      return CSSValueT::color(72, 209, 204, 255);
    case fnv1a("mediumvioletred"):
      return CSSValueT::color(199, 21, 133, 255);
    case fnv1a("midnightblue"):
      return CSSValueT::color(25, 25, 112, 255);
    case fnv1a("mintcream"):
      return CSSValueT::color(245, 255, 250, 255);
    case fnv1a("mistyrose"):
      return CSSValueT::color(255, 228, 225, 255);
    case fnv1a("moccasin"):
      return CSSValueT::color(255, 228, 181, 255);
    case fnv1a("navajowhite"):
      return CSSValueT::color(255, 222, 173, 255);
    case fnv1a("navy"):
      return CSSValueT::color(0, 0, 128, 255);
    case fnv1a("oldlace"):
      return CSSValueT::color(253, 245, 230, 255);
    case fnv1a("olive"):
      return CSSValueT::color(128, 128, 0, 255);
    case fnv1a("olivedrab"):
      return CSSValueT::color(107, 142, 35, 255);
    case fnv1a("orange"):
      return CSSValueT::color(255, 165, 0, 255);
    case fnv1a("orangered"):
      return CSSValueT::color(255, 69, 0, 255);
    case fnv1a("orchid"):
      return CSSValueT::color(218, 112, 214, 255);
    case fnv1a("palegoldenrod"):
      return CSSValueT::color(238, 232, 170, 255);
    case fnv1a("palegreen"):
      return CSSValueT::color(152, 251, 152, 255);
    case fnv1a("paleturquoise"):
      return CSSValueT::color(175, 238, 238, 255);
    case fnv1a("palevioletred"):
      return CSSValueT::color(219, 112, 147, 255);
    case fnv1a("papayawhip"):
      return CSSValueT::color(255, 239, 213, 255);
    case fnv1a("peachpuff"):
      return CSSValueT::color(255, 218, 185, 255);
    case fnv1a("peru"):
      return CSSValueT::color(205, 133, 63, 255);
    case fnv1a("pink"):
      return CSSValueT::color(255, 192, 203, 255);
    case fnv1a("plum"):
      return CSSValueT::color(221, 160, 221, 255);
    case fnv1a("powderblue"):
      return CSSValueT::color(176, 224, 230, 255);
    case fnv1a("purple"):
      return CSSValueT::color(128, 0, 128, 255);
    case fnv1a("rebeccapurple"):
      return CSSValueT::color(102, 51, 153, 255);
    case fnv1a("red"):
      return CSSValueT::color(255, 0, 0, 255);
    case fnv1a("rosybrown"):
      return CSSValueT::color(188, 143, 143, 255);
    case fnv1a("royalblue"):
      return CSSValueT::color(65, 105, 225, 255);
    case fnv1a("saddlebrown"):
      return CSSValueT::color(139, 69, 19, 255);
    case fnv1a("salmon"):
      return CSSValueT::color(250, 128, 114, 255);
    case fnv1a("sandybrown"):
      return CSSValueT::color(244, 164, 96, 255);
    case fnv1a("seagreen"):
      return CSSValueT::color(46, 139, 87, 255);
    case fnv1a("seashell"):
      return CSSValueT::color(255, 245, 238, 255);
    case fnv1a("sienna"):
      return CSSValueT::color(160, 82, 45, 255);
    case fnv1a("silver"):
      return CSSValueT::color(192, 192, 192, 255);
    case fnv1a("skyblue"):
      return CSSValueT::color(135, 206, 235, 255);
    case fnv1a("slateblue"):
      return CSSValueT::color(106, 90, 205, 255);
    case fnv1a("slategray"):
      return CSSValueT::color(112, 128, 144, 255);
    case fnv1a("slategrey"):
      return CSSValueT::color(112, 128, 144, 255);
    case fnv1a("snow"):
      return CSSValueT::color(255, 250, 250, 255);
    case fnv1a("springgreen"):
      return CSSValueT::color(0, 255, 127, 255);
    case fnv1a("steelblue"):
      return CSSValueT::color(70, 130, 180, 255);
    case fnv1a("tan"):
      return CSSValueT::color(210, 180, 140, 255);
    case fnv1a("teal"):
      return CSSValueT::color(0, 128, 128, 255);
    case fnv1a("thistle"):
      return CSSValueT::color(216, 191, 216, 255);
    case fnv1a("tomato"):
      return CSSValueT::color(255, 99, 71, 255);
    case fnv1a("turquoise"):
      return CSSValueT::color(64, 224, 208, 255);
    case fnv1a("violet"):
      return CSSValueT::color(238, 130, 238, 255);
    case fnv1a("wheat"):
      return CSSValueT::color(245, 222, 179, 255);
    case fnv1a("white"):
      return CSSValueT::color(255, 255, 255, 255);
    case fnv1a("whitesmoke"):
      return CSSValueT::color(245, 245, 245, 255);
    case fnv1a("yellow"):
      return CSSValueT::color(255, 255, 0, 255);
    case fnv1a("yellowgreen"):
      return CSSValueT::color(154, 205, 50, 255);
    default:
      return std::nullopt;
  }
}

enum class HexColorType {
  Long,
  Short,
};

constexpr char toLower(char c) {
  if (c >= 'A' && c <= 'Z') {
    return static_cast<char>(c + 32);
  }
  return c;
}

constexpr uint8_t hexToNumeric(std::string_view hex, HexColorType hexType) {
  int result = 0;
  for (char c : hex) {
    int value = 0;
    if (c >= '0' && c <= '9') {
      value = c - '0';
    } else {
      value = toLower(c) - 'a' + 10;
    }
    result *= 16;
    result += value;
  }

  if (hexType == HexColorType::Short) {
    return result * 16 + result;
  } else {
    return result;
  }
}

constexpr bool isHexDigit(char c) {
  return (c >= '0' && c <= '9') || (toLower(c) >= 'a' && toLower(c) <= 'f');
}

constexpr bool isValidHexColor(std::string_view hex) {
  // The syntax of a <hex-color> is a <hash-token> token whose value consists
  // of 3, 4, 6, or 8 hexadecimal digits.
  if (hex.size() != 3 && hex.size() != 4 && hex.size() != 6 &&
      hex.size() != 8) {
    return false;
  }

  for (auto c : hex) {
    if (!isHexDigit(c)) {
      return false;
    }
  }

  return true;
}

}; // namespace facebook::react
