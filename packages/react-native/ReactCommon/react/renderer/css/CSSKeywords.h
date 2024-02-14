/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
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
  Block,
  Center,
  Clip,
  Column,
  ColumnReverse,
  Content,
  Contents,
  Dashed,
  Dotted,
  Double,
  End,
  Fixed,
  Flex,
  FlexEnd,
  FlexStart,
  Grid,
  Groove,
  Hidden,
  Inherit,
  Initial,
  Inline,
  InlineBlock,
  InlineFlex,
  InlineGrid,
  Inset,
  Ltr,
  MaxContent,
  Medium,
  MinContent,
  None,
  Normal,
  NoWrap,
  Outset,
  Relative,
  Ridge,
  Row,
  RowReverse,
  Rtl,
  Scroll,
  Solid,
  SpaceAround,
  SpaceBetween,
  SpaceEvenly,
  Start,
  Static,
  Sticky,
  Stretch,
  Thick,
  Thin,
  Unset,
  Visible,
  Wrap,
  WrapReverse,
};

/**
 * Represents a contrained set of CSS keywords.
 */
template <typename T>
concept CSSKeywordSet = std::is_enum_v<T> && std::
    is_same_v<std::underlying_type_t<T>, std::underlying_type_t<CSSKeyword>>;

/**
 * CSS-wide keywords.
 * https://www.w3.org/TR/css-values-4/#common-keywords
 */
enum class CSSWideKeyword : std::underlying_type_t<CSSKeyword> {
  Inherit = to_underlying(CSSKeyword::Inherit),
  Initial = to_underlying(CSSKeyword::Initial),
  Unset = to_underlying(CSSKeyword::Unset),
};

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
CSS_DEFINE_KEYWORD_CONEPTS(Block)
CSS_DEFINE_KEYWORD_CONEPTS(Center)
CSS_DEFINE_KEYWORD_CONEPTS(Clip)
CSS_DEFINE_KEYWORD_CONEPTS(Column)
CSS_DEFINE_KEYWORD_CONEPTS(ColumnReverse)
CSS_DEFINE_KEYWORD_CONEPTS(Content)
CSS_DEFINE_KEYWORD_CONEPTS(Contents)
CSS_DEFINE_KEYWORD_CONEPTS(Dashed)
CSS_DEFINE_KEYWORD_CONEPTS(Dotted)
CSS_DEFINE_KEYWORD_CONEPTS(Double)
CSS_DEFINE_KEYWORD_CONEPTS(End)
CSS_DEFINE_KEYWORD_CONEPTS(Fixed)
CSS_DEFINE_KEYWORD_CONEPTS(Flex)
CSS_DEFINE_KEYWORD_CONEPTS(FlexEnd)
CSS_DEFINE_KEYWORD_CONEPTS(FlexStart)
CSS_DEFINE_KEYWORD_CONEPTS(Grid)
CSS_DEFINE_KEYWORD_CONEPTS(Groove)
CSS_DEFINE_KEYWORD_CONEPTS(Hidden)
CSS_DEFINE_KEYWORD_CONEPTS(Inherit)
CSS_DEFINE_KEYWORD_CONEPTS(Initial)
CSS_DEFINE_KEYWORD_CONEPTS(Inline)
CSS_DEFINE_KEYWORD_CONEPTS(InlineBlock)
CSS_DEFINE_KEYWORD_CONEPTS(InlineFlex)
CSS_DEFINE_KEYWORD_CONEPTS(InlineGrid)
CSS_DEFINE_KEYWORD_CONEPTS(Inset)
CSS_DEFINE_KEYWORD_CONEPTS(Ltr)
CSS_DEFINE_KEYWORD_CONEPTS(MaxContent)
CSS_DEFINE_KEYWORD_CONEPTS(Medium)
CSS_DEFINE_KEYWORD_CONEPTS(MinContent)
CSS_DEFINE_KEYWORD_CONEPTS(None)
CSS_DEFINE_KEYWORD_CONEPTS(Normal)
CSS_DEFINE_KEYWORD_CONEPTS(NoWrap)
CSS_DEFINE_KEYWORD_CONEPTS(Outset)
CSS_DEFINE_KEYWORD_CONEPTS(Relative)
CSS_DEFINE_KEYWORD_CONEPTS(Ridge)
CSS_DEFINE_KEYWORD_CONEPTS(Row)
CSS_DEFINE_KEYWORD_CONEPTS(RowReverse)
CSS_DEFINE_KEYWORD_CONEPTS(Rtl)
CSS_DEFINE_KEYWORD_CONEPTS(Scroll)
CSS_DEFINE_KEYWORD_CONEPTS(Solid)
CSS_DEFINE_KEYWORD_CONEPTS(SpaceAround)
CSS_DEFINE_KEYWORD_CONEPTS(SpaceBetween)
CSS_DEFINE_KEYWORD_CONEPTS(SpaceEvenly)
CSS_DEFINE_KEYWORD_CONEPTS(Start)
CSS_DEFINE_KEYWORD_CONEPTS(Static)
CSS_DEFINE_KEYWORD_CONEPTS(Sticky)
CSS_DEFINE_KEYWORD_CONEPTS(Stretch)
CSS_DEFINE_KEYWORD_CONEPTS(Thick)
CSS_DEFINE_KEYWORD_CONEPTS(Thin)
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
    constexpr char operator()(char c) const {
      if (c >= 'A' && c <= 'Z') {
        return c + static_cast<char>('a' - 'A');
      }
      return c;
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
    case fnv1a("block"):
      if constexpr (detail::hasBlock<KeywordT>) {
        return KeywordT::Block;
      }
      break;
    case fnv1a("center"):
      if constexpr (detail::hasCenter<KeywordT>) {
        return KeywordT::Center;
      }
      break;
    case fnv1a("clip"):
      if constexpr (detail::hasClip<KeywordT>) {
        return KeywordT::Clip;
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
    case fnv1a("content"):
      if constexpr (detail::hasContent<KeywordT>) {
        return KeywordT::Content;
      }
      break;
    case fnv1a("contents"):
      if constexpr (detail::hasContents<KeywordT>) {
        return KeywordT::Contents;
      }
      break;
    case fnv1a("dashed"):
      if constexpr (detail::hasDashed<KeywordT>) {
        return KeywordT::Dashed;
      }
      break;
    case fnv1a("dotted"):
      if constexpr (detail::hasDotted<KeywordT>) {
        return KeywordT::Dotted;
      }
      break;
    case fnv1a("double"):
      if constexpr (detail::hasDouble<KeywordT>) {
        return KeywordT::Double;
      }
      break;
    case fnv1a("end"):
      if constexpr (detail::hasEnd<KeywordT>) {
        return KeywordT::End;
      }
      break;
    case fnv1a("fixed"):
      if constexpr (detail::hasFixed<KeywordT>) {
        return KeywordT::Fixed;
      }
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
    case fnv1a("grid"):
      if constexpr (detail::hasGrid<KeywordT>) {
        return KeywordT::Grid;
      }
      break;
    case fnv1a("groove"):
      if constexpr (detail::hasGroove<KeywordT>) {
        return KeywordT::Groove;
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
    case fnv1a("inline-block"):
      if constexpr (detail::hasInlineBlock<KeywordT>) {
        return KeywordT::InlineBlock;
      }
      break;
    case fnv1a("inline-flex"):
      if constexpr (detail::hasInlineFlex<KeywordT>) {
        return KeywordT::InlineFlex;
      }
      break;
    case fnv1a("inline-grid"):
      if constexpr (detail::hasInlineGrid<KeywordT>) {
        return KeywordT::InlineGrid;
      }
      break;
    case fnv1a("ltr"):
      if constexpr (detail::hasLtr<KeywordT>) {
        return KeywordT::Ltr;
      }
      break;
    case fnv1a("max-content"):
      if constexpr (detail::hasMaxContent<KeywordT>) {
        return KeywordT::MaxContent;
      }
      break;
    case fnv1a("medium"):
      if constexpr (detail::hasMedium<KeywordT>) {
        return KeywordT::Medium;
      }
      break;
    case fnv1a("min-content"):
      if constexpr (detail::hasMinContent<KeywordT>) {
        return KeywordT::MinContent;
      }
      break;
    case fnv1a("none"):
      if constexpr (detail::hasNone<KeywordT>) {
        return KeywordT::None;
      }
      break;
    case fnv1a("normal"):
      if constexpr (detail::hasNormal<KeywordT>) {
        return KeywordT::Normal;
      }
      break;
    case fnv1a("nowrap"):
      if constexpr (detail::hasNoWrap<KeywordT>) {
        return KeywordT::NoWrap;
      }
      break;
    case fnv1a("outset"):
      if constexpr (detail::hasOutset<KeywordT>) {
        return KeywordT::Outset;
      }
      break;
    case fnv1a("relative"):
      if constexpr (detail::hasRelative<KeywordT>) {
        return KeywordT::Relative;
      }
      break;
    case fnv1a("ridge"):
      if constexpr (detail::hasRidge<KeywordT>) {
        return KeywordT::Ridge;
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
    case fnv1a("solid"):
      if constexpr (detail::hasSolid<KeywordT>) {
        return KeywordT::Solid;
      }
      break;
    case fnv1a("start"):
      if constexpr (detail::hasStart<KeywordT>) {
        return KeywordT::Start;
      }
    case fnv1a("static"):
      if constexpr (detail::hasStatic<KeywordT>) {
        return KeywordT::Static;
      }
      break;
    case fnv1a("sticky"):
      if constexpr (detail::hasSticky<KeywordT>) {
        return KeywordT::Sticky;
      }
      break;
    case fnv1a("stretch"):
      if constexpr (detail::hasStretch<KeywordT>) {
        return KeywordT::Stretch;
      }
      break;
    case fnv1a("thick"):
      if constexpr (detail::hasThick<KeywordT>) {
        return KeywordT::Thick;
      }
      break;
    case fnv1a("thin"):
      if constexpr (detail::hasThin<KeywordT>) {
        return KeywordT::Thin;
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
