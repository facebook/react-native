/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

namespace facebook {
namespace react {

enum class FontStyle { Normal, Italic, Oblique };

enum class FontWeight : int {
  Weight100 = 100,
  UltraLight = 100,
  Weight200 = 200,
  Thin = 200,
  Weight300 = 300,
  Light = 300,
  Weight400 = 400,
  Regular = 400,
  Weight500 = 500,
  Medium = 500,
  Weight600 = 600,
  Semibold = 600,
  Demibold = 600,
  Weight700 = 700,
  Bold = 700,
  Weight800 = 800,
  Heavy = 800,
  Weight900 = 900,
  Black = 900
};

enum class FontVariant : int {
  Default = 0,
  SmallCaps = 1 << 1,
  OldstyleNums = 1 << 2,
  LiningNums = 1 << 3,
  TabularNums = 1 << 4,
  ProportionalNums = 1 << 5
};

enum class EllipsizeMode {
  Clip, // Do not add ellipsize, simply clip.
  Head, // Truncate at head of line: "...wxyz".
  Tail, // Truncate at tail of line: "abcd...".
  Middle // Truncate middle of line: "ab...yz".
};

enum class TextBreakStrategy {
  Simple, // Simple strategy.
  HighQuality, // High-quality strategy, including hyphenation.
  Balanced // Balances line lengths.
};

enum class TextAlignment {
  Natural, // Indicates the default alignment for script.
  Left, // Visually left aligned.
  Center, // Visually centered.
  Right, // Visually right aligned.
  Justified // Fully-justified. The last line in a paragraph is natural-aligned.
};

enum class WritingDirection {
  Natural, // Determines direction using the Unicode Bidi Algorithm rules P2 and
           // P3.
  LeftToRight, // Left to right writing direction.
  RightToLeft // Right to left writing direction.
};

enum class LineBreakStrategy {
  None, // Don't use any line break strategies
  PushOut, // Use the push out line break strategy.
  HangulWordPriority, // When specified, it prohibits breaking between Hangul
                      // characters.
  Standard // Use the same configuration of line break strategies that the
           // system uses for standard UI labels.
};

enum class TextDecorationLineType {
  None,
  Underline,
  Strikethrough,
  UnderlineStrikethrough
};

enum class TextDecorationStyle { Solid, Double, Dotted, Dashed };

enum class AccessibilityRole {
  None,
  Button,
  Link,
  Search,
  Image,
  Imagebutton,
  Keyboardkey,
  Text,
  Adjustable,
  Summary,
  Header,
  Alert,
  Checkbox,
  Combobox,
  Menu,
  Menubar,
  Menuitem,
  Progressbar,
  Radio,
  Radiogroup,
  Scrollbar,
  Spinbutton,
  Switch,
  Tab,
  TabBar,
  Tablist,
  Timer,
  Toolbar,
};

enum class TextTransform {
  None,
  Uppercase,
  Lowercase,
  Capitalize,
  Unset,
};

enum class HyphenationFrequency {
  None, // No hyphenation.
  Normal, // Less frequent hyphenation.
  Full // Standard amount of hyphenation.
};

} // namespace react
} // namespace facebook

namespace std {
template <>
struct hash<facebook::react::FontVariant> {
  size_t operator()(const facebook::react::FontVariant &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::TextAlignment> {
  size_t operator()(const facebook::react::TextAlignment &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::FontStyle> {
  size_t operator()(const facebook::react::FontStyle &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::TextDecorationLineType> {
  size_t operator()(const facebook::react::TextDecorationLineType &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::WritingDirection> {
  size_t operator()(const facebook::react::WritingDirection &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::TextDecorationStyle> {
  size_t operator()(const facebook::react::TextDecorationStyle &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::FontWeight> {
  size_t operator()(const facebook::react::FontWeight &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::EllipsizeMode> {
  size_t operator()(const facebook::react::EllipsizeMode &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::TextBreakStrategy> {
  size_t operator()(const facebook::react::TextBreakStrategy &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::AccessibilityRole> {
  size_t operator()(const facebook::react::AccessibilityRole &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::TextTransform> {
  size_t operator()(const facebook::react::TextTransform &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<facebook::react::HyphenationFrequency> {
  size_t operator()(const facebook::react::HyphenationFrequency &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};
} // namespace std
