/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <locale>
#include <optional>
#include <string_view>

#include <react/utils/fnv1a.h>
#include <react/utils/to_underlying.h>

namespace facebook::react {

/**
 * One of any predefined CSS keywords.
 * https://www.w3.org/TR/css-values-4/#keywords
 */
enum class CSSKeyword : uint8_t {
  Absolute,
  Auto,
  Baseline,
  Center,
  Column,
  ColumnReverse,
  Flex,
  FlexEnd,
  FlexStart,
  Hidden,
  Inherit,
  Initial,
  Inline,
  Ltr,
  None,
  NoWrap,
  Relative,
  Row,
  RowReverse,
  Rtl,
  Scroll,
  SpaceAround,
  SpaceBetween,
  SpaceEvenly,
  Static,
  Stretch,
  Unset,
  Visible,
  Wrap,
  WrapReverse,
};

/**
 * Represents a set of CSS keywords, including CSS-wide keywords.
 */
template <typename T>
concept CSSKeywordSet = std::is_enum_v<T> && requires {
  { T::Inherit } -> std::same_as<T>;
  { T::Initial } -> std::same_as<T>;
  { T::Unset } -> std::same_as<T>;
};

/**
 * Defines a new set of CSS keywords
 */
#define CSS_DEFINE_KEYWORD_SET(name, ...)         \
  enum class name : uint8_t {                     \
    Inherit = to_underlying(CSSKeyword::Inherit), \
    Initial = to_underlying(CSSKeyword::Initial), \
    Unset = to_underlying(CSSKeyword::Unset),     \
    __VA_ARGS__                                   \
  };

/**
 * CSS-wide keywords.
 * https://www.w3.org/TR/css-values-4/#common-keywords
 */
CSS_DEFINE_KEYWORD_SET(CSSWideKeyword)

/**
 * CSS-wide keywords along with a context-dependent "auto" keyword.
 */
CSS_DEFINE_KEYWORD_SET(CSSAutoKeyword, Auto = to_underlying(CSSKeyword::Auto))

/**
 * Keywords for the CSS "align-content" property.
 * https://www.w3.org/TR/css-flexbox-1/#align-content-property
 * https://www.w3.org/TR/css-align-3/#align-justify-content
 */
CSS_DEFINE_KEYWORD_SET(
    CSSAlignContent,
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    SpaceAround = to_underlying(CSSKeyword::SpaceAround),
    SpaceBetween = to_underlying(CSSKeyword::SpaceBetween),
    SpaceEvenly = to_underlying(CSSKeyword::SpaceEvenly),
    Stretch = to_underlying(CSSKeyword::Stretch))

/**
 * Keywords for the CSS "align-items" property.
 * https://www.w3.org/TR/css-flexbox-1/#align-items-property
 * https://www.w3.org/TR/css-align-3/#align-items-property
 */
CSS_DEFINE_KEYWORD_SET(
    CSSAlignItems,
    Baseline = to_underlying(CSSKeyword::Baseline),
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    Stretch = to_underlying(CSSKeyword::Stretch))

/**
 * Keywords for the CSS "align-items" property.
 * https://www.w3.org/TR/css-flexbox-1/#align-self-property
 * https://www.w3.org/TR/css-align-3/#align-self-property
 */
CSS_DEFINE_KEYWORD_SET(
    CSSAlignSelf,
    Auto = to_underlying(CSSKeyword::Auto),
    Baseline = to_underlying(CSSKeyword::Baseline),
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    Stretch = to_underlying(CSSKeyword::Stretch))

/**
 * Keywords for the CSS "direction" property.
 * https://www.w3.org/TR/css-writing-modes-3/#direction
 */
CSS_DEFINE_KEYWORD_SET(
    CSSDirection,
    Ltr = to_underlying(CSSKeyword::Ltr),
    Rtl = to_underlying(CSSKeyword::Rtl))

/**
 * Keywords for the CSS "display" property.
 * https://www.w3.org/TR/css-display-3/#display-type
 */
CSS_DEFINE_KEYWORD_SET(
    CSSDisplay,
    Flex = to_underlying(CSSKeyword::Flex),
    Inline = to_underlying(CSSKeyword::Inline),
    None = to_underlying(CSSKeyword::None))

/**
 * Keywords for the CSS "flex-direction" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-direction-property
 */
CSS_DEFINE_KEYWORD_SET(
    CSSFlexDirection,
    Column = to_underlying(CSSKeyword::Column),
    ColumnReverse = to_underlying(CSSKeyword::ColumnReverse),
    Row = to_underlying(CSSKeyword::Row),
    RowReverse = to_underlying(CSSKeyword::RowReverse))

/**
 * Keywords for the CSS "flex-wrap" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-wrap-property
 */
CSS_DEFINE_KEYWORD_SET(
    CSSFlexWrap,
    NoWrap = to_underlying(CSSKeyword::NoWrap),
    Wrap = to_underlying(CSSKeyword::Wrap),
    WrapReverse = to_underlying(CSSKeyword::WrapReverse))

/**
 * Keywords for the CSS "justify-content" property.
 * https://www.w3.org/TR/css-flexbox-1/#justify-content-property
 * https://www.w3.org/TR/css-align-3/#align-justify-content
 */
CSS_DEFINE_KEYWORD_SET(
    CSSJustifyContent,
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    SpaceAround = to_underlying(CSSKeyword::SpaceAround),
    SpaceBetween = to_underlying(CSSKeyword::SpaceBetween),
    SpaceEvenly = to_underlying(CSSKeyword::SpaceEvenly))

/**
 * Keywords for the CSS "overflow" property.
 * https://www.w3.org/TR/css-overflow-3/#overflow-control
 */
CSS_DEFINE_KEYWORD_SET(
    CSSOverflow,
    Hidden = to_underlying(CSSKeyword::Hidden),
    Scroll = to_underlying(CSSKeyword::Scroll),
    Visible = to_underlying(CSSKeyword::Visible))

/**
 * Keywords for the CSS "position" property.
 * https://www.w3.org/TR/css-position-3/#position-property
 */
CSS_DEFINE_KEYWORD_SET(
    CSSPosition,
    Absolute = to_underlying(CSSKeyword::Absolute),
    Relative = to_underlying(CSSKeyword::Relative),
    Static = to_underlying(CSSKeyword::Static))

/**
 * Compare two keywords of any representation
 */
constexpr bool operator==(CSSKeywordSet auto lhs, CSSKeywordSet auto rhs) {
  return to_underlying(lhs) == to_underlying(rhs);
}

/**
 * Defines a concept for whether an enum has a given member.
 */
#define CSS_DEFINE_KEYWORD_CONEPTS(name)                             \
  namespace detail {                                                 \
  template <typename T>                                              \
  concept has##name = (CSSKeywordSet<T> && requires() { T::name; }); \
  }

CSS_DEFINE_KEYWORD_CONEPTS(Absolute)
CSS_DEFINE_KEYWORD_CONEPTS(Auto)
CSS_DEFINE_KEYWORD_CONEPTS(Baseline)
CSS_DEFINE_KEYWORD_CONEPTS(Center)
CSS_DEFINE_KEYWORD_CONEPTS(Column)
CSS_DEFINE_KEYWORD_CONEPTS(ColumnReverse)
CSS_DEFINE_KEYWORD_CONEPTS(Flex)
CSS_DEFINE_KEYWORD_CONEPTS(FlexEnd)
CSS_DEFINE_KEYWORD_CONEPTS(FlexStart)
CSS_DEFINE_KEYWORD_CONEPTS(Hidden)
CSS_DEFINE_KEYWORD_CONEPTS(Inherit)
CSS_DEFINE_KEYWORD_CONEPTS(Initial)
CSS_DEFINE_KEYWORD_CONEPTS(Inline)
CSS_DEFINE_KEYWORD_CONEPTS(Ltr)
CSS_DEFINE_KEYWORD_CONEPTS(None)
CSS_DEFINE_KEYWORD_CONEPTS(NoWrap)
CSS_DEFINE_KEYWORD_CONEPTS(Relative)
CSS_DEFINE_KEYWORD_CONEPTS(Row)
CSS_DEFINE_KEYWORD_CONEPTS(RowReverse)
CSS_DEFINE_KEYWORD_CONEPTS(Rtl)
CSS_DEFINE_KEYWORD_CONEPTS(Scroll)
CSS_DEFINE_KEYWORD_CONEPTS(SpaceAround)
CSS_DEFINE_KEYWORD_CONEPTS(SpaceBetween)
CSS_DEFINE_KEYWORD_CONEPTS(SpaceEvenly)
CSS_DEFINE_KEYWORD_CONEPTS(Static)
CSS_DEFINE_KEYWORD_CONEPTS(Stretch)
CSS_DEFINE_KEYWORD_CONEPTS(Unset)
CSS_DEFINE_KEYWORD_CONEPTS(Visible)
CSS_DEFINE_KEYWORD_CONEPTS(Wrap)
CSS_DEFINE_KEYWORD_CONEPTS(WrapReverse)

/**
 * Parses an ident token, case-insensitive, into a keyword.
 *
 * Returns KeywordT::Unset if the ident does not match any entries
 * in the keyword-set, or CSS-wide keywords.
 */
template <CSSKeywordSet KeywordT>
constexpr std::optional<KeywordT> parseCSSKeyword(std::string_view ident) {
  struct LowerCaseTransform {
    char operator()(char c) const {
      return static_cast<char>(tolower(c));
    }
  };

  switch (fnv1a<LowerCaseTransform>(ident)) {
    case fnv1a("absolute"):
      if constexpr (detail::hasAbsolute<KeywordT>) {
        return KeywordT::Absolute;
      }
      break;
    case fnv1a("auto"):
      if constexpr (detail::hasAuto<KeywordT>) {
        return KeywordT::Auto;
      }
      break;
    case fnv1a("baseline"):
      if constexpr (detail::hasBaseline<KeywordT>) {
        return KeywordT::Baseline;
      }
      break;
    case fnv1a("center"):
      if constexpr (detail::hasCenter<KeywordT>) {
        return KeywordT::Center;
      }
      break;
    case fnv1a("column"):
      if constexpr (detail::hasColumn<KeywordT>) {
        return KeywordT::Column;
      }
      break;
    case fnv1a("column-reverse"):
      if constexpr (detail::hasColumnReverse<KeywordT>) {
        return KeywordT::ColumnReverse;
      }
      break;
    case fnv1a("flex"):
      if constexpr (detail::hasFlex<KeywordT>) {
        return KeywordT::Flex;
      }
      break;
    case fnv1a("flex-end"):
      if constexpr (detail::hasFlexEnd<KeywordT>) {
        return KeywordT::FlexEnd;
      }
      break;
    case fnv1a("flex-start"):
      if constexpr (detail::hasFlexStart<KeywordT>) {
        return KeywordT::FlexStart;
      }
      break;
    case fnv1a("hidden"):
      if constexpr (detail::hasHidden<KeywordT>) {
        return KeywordT::Hidden;
      }
      break;
    case fnv1a("inherit"):
      if constexpr (detail::hasInherit<KeywordT>) {
        return KeywordT::Inherit;
      }
      break;
    case fnv1a("inline"):
      if constexpr (detail::hasInline<KeywordT>) {
        return KeywordT::Inline;
      }
      break;
    case fnv1a("ltr"):
      if constexpr (detail::hasLtr<KeywordT>) {
        return KeywordT::Ltr;
      }
      break;
    case fnv1a("none"):
      if constexpr (detail::hasNone<KeywordT>) {
        return KeywordT::None;
      }
      break;
    case fnv1a("no-wrap"):
      if constexpr (detail::hasNoWrap<KeywordT>) {
        return KeywordT::NoWrap;
      }
      break;
    case fnv1a("relative"):
      if constexpr (detail::hasRelative<KeywordT>) {
        return KeywordT::Relative;
      }
      break;
    case fnv1a("row"):
      if constexpr (detail::hasRow<KeywordT>) {
        return KeywordT::Row;
      }
      break;
    case fnv1a("row-reverse"):
      if constexpr (detail::hasRowReverse<KeywordT>) {
        return KeywordT::RowReverse;
      }
      break;
    case fnv1a("rtl"):
      if constexpr (detail::hasRtl<KeywordT>) {
        return KeywordT::Rtl;
      }
      break;
    case fnv1a("space-between"):
      if constexpr (detail::hasSpaceBetween<KeywordT>) {
        return KeywordT::SpaceBetween;
      }
      break;
    case fnv1a("space-around"):
      if constexpr (detail::hasSpaceAround<KeywordT>) {
        return KeywordT::SpaceAround;
      }
      break;
    case fnv1a("space-evenly"):
      if constexpr (detail::hasSpaceEvenly<KeywordT>) {
        return KeywordT::SpaceEvenly;
      }
      break;
    case fnv1a("scroll"):
      if constexpr (detail::hasScroll<KeywordT>) {
        return KeywordT::Scroll;
      }
      break;
    case fnv1a("static"):
      if constexpr (detail::hasStatic<KeywordT>) {
        return KeywordT::Static;
      }
      break;
    case fnv1a("stretch"):
      if constexpr (detail::hasStretch<KeywordT>) {
        return KeywordT::Stretch;
      }
      break;
    case fnv1a("unset"):
      if constexpr (detail::hasUnset<KeywordT>) {
        return KeywordT::Unset;
      }
      break;
    case fnv1a("visible"):
      if constexpr (detail::hasVisible<KeywordT>) {
        return KeywordT::Visible;
      }
      break;
    case fnv1a("wrap"):
      if constexpr (detail::hasWrap<KeywordT>) {
        return KeywordT::Wrap;
      }
      break;
    case fnv1a("wrap-reverse"):
      if constexpr (detail::hasWrapReverse<KeywordT>) {
        return KeywordT::WrapReverse;
      }
      break;
    default:
      break;
  }

  return std::nullopt;
}

} // namespace facebook::react
