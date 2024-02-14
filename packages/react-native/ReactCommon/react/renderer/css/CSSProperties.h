/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/css/CSSValue.h>

namespace facebook::react {

/**
 * All CSS properties,including CSS,and React-Native specific shorthands
 * https://www.w3.org/TR/css-cascade-4/#css-property
 */
enum class CSSProp {
  AlignContent,
  AlignItems,
  AlignSelf,
  AspectRatio,
  BorderBlockEndWidth,
  BorderBlockStartWidth,
  BorderBlockWidth,
  BorderBottomWidth,
  BorderEndWidth,
  BorderHorizontalWidth,
  BorderInlineEndWidth,
  BorderInlineStartWidth,
  BorderInlineWidth,
  BorderLeftWidth,
  BorderRightWidth,
  BorderStartWidth,
  BorderTopWidth,
  BorderVerticalWidth,
  BorderWidth,
  Bottom,
  ColumnGap,
  Direction,
  Display,
  End,
  Flex,
  FlexBasis,
  FlexDirection,
  FlexGrow,
  FlexShrink,
  FlexWrap,
  Gap,
  Height,
  Inset,
  InsetBlock,
  InsetBlockEnd,
  InsetBlockStart,
  InsetInline,
  InsetInlineEnd,
  InsetInlineStart,
  JustifyContent,
  Left,
  Margin,
  MarginBlock,
  MarginBlockEnd,
  MarginBlockStart,
  MarginBottom,
  MarginEnd,
  MarginHorizontal,
  MarginInline,
  MarginInlineEnd,
  MarginInlineStart,
  MarginLeft,
  MarginRight,
  MarginStart,
  MarginTop,
  MarginVertical,
  MaxHeight,
  MaxWidth,
  MinHeight,
  MinWidth,
  Overflow,
  Padding,
  PaddingBlock,
  PaddingBlockEnd,
  PaddingBlockStart,
  PaddingBottom,
  PaddingEnd,
  PaddingHorizontal,
  PaddingInline,
  PaddingInlineEnd,
  PaddingInlineStart,
  PaddingLeft,
  PaddingRight,
  PaddingStart,
  PaddingTop,
  PaddingVertical,
  Position,
  Right,
  RowGap,
  Start,
  Top,
  Width,
  // Please update "kCSSPropCount" if adding a new prop to the end
};

/**
 * The total number of CSS properties.
 */
constexpr auto kCSSPropCount = to_underlying(CSSProp::Width) + 1;

/**
 * CSSPropDefinition associates a CSSProp to its
 * supported data types, Keyword, and other behaviors.
 */
template <CSSProp P>
struct CSSPropDefinition {};

template <CSSProp P>
using CSSAllowedKeywords = typename CSSPropDefinition<P>::Keyword;

template <CSSProp P>
using CSSSpecifiedValue = typename CSSPropDefinition<P>::SpecifiedValue;

template <CSSProp P>
using CSSComputedValue = typename CSSPropDefinition<P>::ComputedValue;

/**
 * CSS "align-content" property.
 * https://www.w3.org/TR/css-flexbox-1/#align-content-property
 * https://www.w3.org/TR/css-align-3/#align-justify-content
 */
template <>
struct CSSPropDefinition<CSSProp::AlignContent> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    SpaceAround = to_underlying(CSSKeyword::SpaceAround),
    SpaceBetween = to_underlying(CSSKeyword::SpaceBetween),
    SpaceEvenly = to_underlying(CSSKeyword::SpaceEvenly),
    Stretch = to_underlying(CSSKeyword::Stretch),
    Start = to_underlying(CSSKeyword::Start),
    End = to_underlying(CSSKeyword::End),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS "align-items" property.
 * https://www.w3.org/TR/css-flexbox-1/#align-items-property
 * https://www.w3.org/TR/css-align-3/#align-items-property
 */
template <>
struct CSSPropDefinition<CSSProp::AlignItems> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Baseline = to_underlying(CSSKeyword::Baseline),
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    Stretch = to_underlying(CSSKeyword::Stretch),
    Start = to_underlying(CSSKeyword::Start),
    End = to_underlying(CSSKeyword::End),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS "align-items" property.
 * https://www.w3.org/TR/css-flexbox-1/#propdef-align-self
 * https://www.w3.org/TR/css-align-3/#align-self-property
 */
template <>
struct CSSPropDefinition<CSSProp::AlignSelf> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    Baseline = to_underlying(CSSKeyword::Baseline),
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    Stretch = to_underlying(CSSKeyword::Stretch),
    Start = to_underlying(CSSKeyword::Start),
    End = to_underlying(CSSKeyword::End),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS "aspect-ratio" property.
 * https://www.w3.org/TR/css-sizing-4/#aspect-ratio
 */
template <>
struct CSSPropDefinition<CSSProp::AspectRatio> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword, CSSRatio>;
  using ComputedValue = CSSValueVariant<Keyword, CSSRatio>;
};

/**
 * CSS "border-width" properties
 * https://www.w3.org/TR/css-backgrounds-3/#border-width
 */
template <>
struct CSSPropDefinition<CSSProp::BorderWidth> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Thin = to_underlying(CSSKeyword::Thin),
    Medium = to_underlying(CSSKeyword::Medium),
    Thick = to_underlying(CSSKeyword::Thick),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword, CSSLength>;
  using ComputedValue = CSSValueVariant<CSSLength>;
};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockEndWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockStartWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderBottomWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderEndWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderHorizontalWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineEndWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineStartWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderLeftWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderRightWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderStartWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderTopWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

template <>
struct CSSPropDefinition<CSSProp::BorderVerticalWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {};

/**
 * CSS "direction" property.
 * https://www.w3.org/TR/css-writing-modes-3/#direction
 */
template <>
struct CSSPropDefinition<CSSProp::Direction> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Ltr = to_underlying(CSSKeyword::Ltr),
    Rtl = to_underlying(CSSKeyword::Rtl),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS "display" property.
 * https://www.w3.org/TR/css-display-3/#display-type
 */
template <>
struct CSSPropDefinition<CSSProp::Display> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    None = to_underlying(CSSKeyword::None),
    Contents = to_underlying(CSSKeyword::Contents),
    Inline = to_underlying(CSSKeyword::Inline),
    Block = to_underlying(CSSKeyword::Block),
    InlineBlock = to_underlying(CSSKeyword::InlineBlock),
    Flex = to_underlying(CSSKeyword::Flex),
    InlineFlex = to_underlying(CSSKeyword::InlineFlex),
    Grid = to_underlying(CSSKeyword::Grid),
    InlineGrid = to_underlying(CSSKeyword::InlineGrid),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS "flex" shorthand property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-property
 *
 * React Native's interpretation of this prop is currently different than in CSS
 */
template <>
struct CSSPropDefinition<CSSProp::Flex> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    None = to_underlying(CSSKeyword::None),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword, CSSNumber>;
  using ComputedValue = CSSValueVariant<Keyword, CSSNumber>;
};

/**
 * CSS "flex-basis" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-basis-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexBasis> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    Content = to_underlying(CSSKeyword::Content),
  };

  using SpecifiedValue =
      CSSValueVariant<CSSWideKeyword, Keyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;
};

/**
 * CSS "flex-direction" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-direction-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexDirection> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Row = to_underlying(CSSKeyword::Row),
    RowReverse = to_underlying(CSSKeyword::RowReverse),
    Column = to_underlying(CSSKeyword::Column),
    ColumnReverse = to_underlying(CSSKeyword::ColumnReverse),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS "flex-grow" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-grow-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexGrow> {
  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, CSSNumber>;
  using ComputedValue = CSSValueVariant<CSSNumber>;
};

/**
 * CSS "flex-shrink" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-shrink-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexShrink> {
  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, CSSNumber>;
  using ComputedValue = CSSValueVariant<CSSNumber>;
};

/**
 * CSS "flex-wrap" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-wrap-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexWrap> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    NoWrap = to_underlying(CSSKeyword::NoWrap),
    Wrap = to_underlying(CSSKeyword::Wrap),
    WrapReverse = to_underlying(CSSKeyword::WrapReverse),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS gutter properties.
 * https://www.w3.org/TR/css-align-3/#column-row-gap
 */
template <>
struct CSSPropDefinition<CSSProp::Gap> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Normal = to_underlying(CSSKeyword::Normal),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword, CSSLength>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength>;
};

template <>
struct CSSPropDefinition<CSSProp::ColumnGap> : CSSPropDefinition<CSSProp::Gap> {
};

template <>
struct CSSPropDefinition<CSSProp::RowGap> : CSSPropDefinition<CSSProp::Gap> {};

/**
 * CSS sizing properties
 * https://www.w3.org/TR/css-sizing-3/#sizing-properties
 */
template <>
struct CSSPropDefinition<CSSProp::Height> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    MaxContent = to_underlying(CSSKeyword::MaxContent),
    MinContent = to_underlying(CSSKeyword::MinContent),
  };

  using SpecifiedValue =
      CSSValueVariant<CSSWideKeyword, Keyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;
};

template <>
struct CSSPropDefinition<CSSProp::Width> : CSSPropDefinition<CSSProp::Height> {
};

template <>
struct CSSPropDefinition<CSSProp::MinWidth>
    : CSSPropDefinition<CSSProp::Height> {};

template <>
struct CSSPropDefinition<CSSProp::MinHeight>
    : CSSPropDefinition<CSSProp::Height> {};

template <>
struct CSSPropDefinition<CSSProp::MaxWidth>
    : CSSPropDefinition<CSSProp::Height> {};

template <>
struct CSSPropDefinition<CSSProp::MaxHeight>
    : CSSPropDefinition<CSSProp::Height> {};

/**
 * CSS box inset properties
 * https://drafts.csswg.org/css-position-3/#insets
 */
template <>
struct CSSPropDefinition<CSSProp::Inset> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
  };

  using SpecifiedValue =
      CSSValueVariant<CSSWideKeyword, Keyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;
};

template <>
struct CSSPropDefinition<CSSProp::Top> : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::Right> : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::Bottom> : CSSPropDefinition<CSSProp::Inset> {
};

template <>
struct CSSPropDefinition<CSSProp::Left> : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::Start> : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::End> : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::InsetBlock>
    : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::InsetBlockEnd>
    : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::InsetBlockStart>
    : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::InsetInline>
    : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::InsetInlineEnd>
    : CSSPropDefinition<CSSProp::Inset> {};

template <>
struct CSSPropDefinition<CSSProp::InsetInlineStart>
    : CSSPropDefinition<CSSProp::Inset> {};

/**
 * CSS "justify-content" property.
 * https://www.w3.org/TR/css-flexbox-1/#justify-content-property
 * https://www.w3.org/TR/css-align-3/#align-justify-content
 */
template <>
struct CSSPropDefinition<CSSProp::JustifyContent> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    SpaceAround = to_underlying(CSSKeyword::SpaceAround),
    SpaceBetween = to_underlying(CSSKeyword::SpaceBetween),
    SpaceEvenly = to_underlying(CSSKeyword::SpaceEvenly),
    Start = to_underlying(CSSKeyword::Start),
    End = to_underlying(CSSKeyword::End),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS "margin" properties
 * https://www.w3.org/TR/css-box-4/#margins
 */
template <>
struct CSSPropDefinition<CSSProp::Margin> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
  };

  using SpecifiedValue =
      CSSValueVariant<CSSWideKeyword, Keyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;
};

template <>
struct CSSPropDefinition<CSSProp::MarginBlock>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginBlockEnd>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginBlockStart>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginBottom>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginEnd>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginHorizontal>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginInline>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginInlineEnd>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginInlineStart>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginLeft>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginRight>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginStart>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginTop>
    : CSSPropDefinition<CSSProp::Margin> {};

template <>
struct CSSPropDefinition<CSSProp::MarginVertical>
    : CSSPropDefinition<CSSProp::Margin> {};

/**
 * CSS "overflow" property.
 * https://www.w3.org/TR/css-overflow-3/#overflow-control
 */
template <>
struct CSSPropDefinition<CSSProp::Overflow> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    Clip = to_underlying(CSSKeyword::Clip),
    Hidden = to_underlying(CSSKeyword::Hidden),
    Scroll = to_underlying(CSSKeyword::Scroll),
    Visible = to_underlying(CSSKeyword::Visible),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

/**
 * CSS padding properties
 * https://www.w3.org/TR/css-box-4/#paddings
 */
template <>
struct CSSPropDefinition<CSSProp::Padding> {
  using SpecifiedValue =
      CSSValueVariant<CSSWideKeyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<CSSLength, CSSPercentage>;
};

template <>
struct CSSPropDefinition<CSSProp::PaddingBlock>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingBlockEnd>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingBlockStart>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingBottom>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingEnd>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingHorizontal>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingInline>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingInlineEnd>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingInlineStart>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingLeft>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingRight>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingStart>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingTop>
    : CSSPropDefinition<CSSProp::Padding> {};

template <>
struct CSSPropDefinition<CSSProp::PaddingVertical>
    : CSSPropDefinition<CSSProp::Padding> {};

/**
 * CSS "position" property.
 * https://www.w3.org/TR/css-position-3/#position-property
 */
template <>
struct CSSPropDefinition<CSSProp::Position> {
  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Static = to_underlying(CSSKeyword::Static),
    Relative = to_underlying(CSSKeyword::Relative),
    Absolute = to_underlying(CSSKeyword::Absolute),
    Fixed = to_underlying(CSSKeyword::Fixed),
    Sticky = to_underlying(CSSKeyword::Sticky),
  };

  using SpecifiedValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;
};

} // namespace facebook::react
