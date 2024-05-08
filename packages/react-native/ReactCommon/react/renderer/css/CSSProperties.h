/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/css/CSSValueVariant.h>

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
  BorderBlockEndStyle,
  BorderBlockEndWidth,
  BorderBlockStartStyle,
  BorderBlockStartWidth,
  BorderBlockStyle,
  BorderBlockWidth,
  BorderBottomLeftRadius,
  BorderBottomRightRadius,
  BorderBottomStyle,
  BorderBottomWidth,
  BorderEndEndRadius,
  BorderEndStartRadius,
  BorderEndWidth,
  BorderHorizontalWidth,
  BorderInlineEndStyle,
  BorderInlineEndWidth,
  BorderInlineStartStyle,
  BorderInlineStartWidth,
  BorderInlineStyle,
  BorderInlineWidth,
  BorderLeftStyle,
  BorderLeftWidth,
  BorderRadius,
  BorderRightStyle,
  BorderRightWidth,
  BorderStartEndRadius,
  BorderStartStartRadius,
  BorderStartWidth,
  BorderStyle,
  BorderTopLeftRadius,
  BorderTopRightRadius,
  BorderTopStyle,
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
  Opacity,
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
using CSSDeclaredValue = typename CSSPropDefinition<P>::DeclaredValue;

template <CSSProp P>
using CSSSpecifiedValue = typename CSSPropDefinition<P>::SpecifiedValue;

template <CSSProp P>
using CSSComputedValue = typename CSSPropDefinition<P>::ComputedValue;

/**
 * Whether to behave in accordance with W3C specs, or to incorporate React
 * Native specific tweaks to defaults and computation.
 */
enum class CSSFlavor {
  W3C,
  ReactNative,
};

/**
 * CSS "align-content" property.
 * https://www.w3.org/TR/css-flexbox-1/#align-content-property
 * https://www.w3.org/TR/css-align-3/#align-justify-content
 */
template <>
struct CSSPropDefinition<CSSProp::AlignContent> {
  constexpr static std::string_view kName = "alignContent";

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

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor flavor) {
    return flavor == CSSFlavor::W3C
        ? DeclaredValue::keyword(Keyword::Stretch)
        : DeclaredValue::keyword(Keyword::FlexStart);
  }
};

/**
 * CSS "align-items" property.
 * https://www.w3.org/TR/css-flexbox-1/#align-items-property
 * https://www.w3.org/TR/css-align-3/#align-items-property
 */
template <>
struct CSSPropDefinition<CSSProp::AlignItems> {
  constexpr static std::string_view kName = "alignItems";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Baseline = to_underlying(CSSKeyword::Baseline),
    Center = to_underlying(CSSKeyword::Center),
    FlexEnd = to_underlying(CSSKeyword::FlexEnd),
    FlexStart = to_underlying(CSSKeyword::FlexStart),
    Stretch = to_underlying(CSSKeyword::Stretch),
    Start = to_underlying(CSSKeyword::Start),
    End = to_underlying(CSSKeyword::End),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Stretch);
  }
};

/**
 * CSS "align-self" property.
 * https://www.w3.org/TR/css-flexbox-1/#propdef-align-self
 * https://www.w3.org/TR/css-align-3/#align-self-property
 */
template <>
struct CSSPropDefinition<CSSProp::AlignSelf> {
  constexpr static std::string_view kName = "alignSelf";

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

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Auto);
  }
};

/**
 * CSS "aspect-ratio" property.
 * https://www.w3.org/TR/css-sizing-4/#aspect-ratio
 */
template <>
struct CSSPropDefinition<CSSProp::AspectRatio> {
  constexpr static std::string_view kName = "aspectRatio";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword, CSSRatio>;
  using SpecifiedValue = CSSValueVariant<Keyword, CSSRatio>;
  using ComputedValue = CSSValueVariant<Keyword, CSSRatio>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Auto);
  }
};

/**
 * CSS "border-radius" properties
 * https://www.w3.org/TR/css-backgrounds-3/#border-radius
 */
template <>
struct CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderRadius";

  using DeclaredValue =
      CSSValueVariant<CSSWideKeyword, CSSLength, CSSPercentage>;
  using SpecifiedValue = CSSValueVariant<CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<CSSLength, CSSPercentage>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::length(0.0f, CSSLengthUnit::Px);
  }
};

template <>
struct CSSPropDefinition<CSSProp::BorderTopLeftRadius>
    : CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderTopLeftRadius";
};

template <>
struct CSSPropDefinition<CSSProp::BorderTopRightRadius>
    : CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderTopRightRadius";
};

template <>
struct CSSPropDefinition<CSSProp::BorderBottomLeftRadius>
    : CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderBottomLeftRadius";
};

template <>
struct CSSPropDefinition<CSSProp::BorderBottomRightRadius>
    : CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderBottomRightRadius";
};

template <>
struct CSSPropDefinition<CSSProp::BorderStartStartRadius>
    : CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderStartStartRadius";
};

template <>
struct CSSPropDefinition<CSSProp::BorderStartEndRadius>
    : CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderStartEndRadius";
};

template <>
struct CSSPropDefinition<CSSProp::BorderEndStartRadius>
    : CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderEndStartRadius";
};

template <>
struct CSSPropDefinition<CSSProp::BorderEndEndRadius>
    : CSSPropDefinition<CSSProp::BorderRadius> {
  constexpr static std::string_view kName = "borderEndEndRadius";
};

/**
 * CSS "border-style" properties
 * https://www.w3.org/TR/css-backgrounds-3/#border-style
 */
template <>
struct CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderStyle";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    None = to_underlying(CSSKeyword::None),
    Hidden = to_underlying(CSSKeyword::Hidden),
    Dotted = to_underlying(CSSKeyword::Dotted),
    Dashed = to_underlying(CSSKeyword::Dashed),
    Solid = to_underlying(CSSKeyword::Solid),
    Double = to_underlying(CSSKeyword::Double),
    Groove = to_underlying(CSSKeyword::Groove),
    Ridge = to_underlying(CSSKeyword::Ridge),
    Inset = to_underlying(CSSKeyword::Inset),
    Outset = to_underlying(CSSKeyword::Outset),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor flavor) {
    return flavor == CSSFlavor::W3C ? DeclaredValue::keyword(Keyword::None)
                                    : DeclaredValue::keyword(Keyword::Solid);
  }
};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockEndStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderBlockEndStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockStartStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderBlockStartStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderBlockStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderBottomStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderBottomStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineEndStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderInlineEndStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineStartStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderInlineStartStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderInlineStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderLeftStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderLeftStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderRightStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderRightStyle";
};

template <>
struct CSSPropDefinition<CSSProp::BorderTopStyle>
    : CSSPropDefinition<CSSProp::BorderStyle> {
  constexpr static std::string_view kName = "borderTopStyle";
};

/**
 * CSS "border-width" properties
 * https://www.w3.org/TR/css-backgrounds-3/#border-width
 */
template <>
struct CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderWidth";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Thin = to_underlying(CSSKeyword::Thin),
    Medium = to_underlying(CSSKeyword::Medium),
    Thick = to_underlying(CSSKeyword::Thick),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword, CSSLength>;
  using SpecifiedValue = CSSValueVariant<CSSLength, CSSKeyword>;
  using ComputedValue = CSSValueVariant<CSSLength>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor flavor) {
    return flavor == CSSFlavor::W3C
        ? DeclaredValue::keyword(Keyword::Medium)
        : DeclaredValue::length(0.0f, CSSLengthUnit::Px);
  }
};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockEndWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderBlockEndWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockStartWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderBlockStartWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderBlockWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderBlockWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderBottomWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderBottomWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderEndWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderEndWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderHorizontalWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderHorizontalWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineEndWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderInlineEndWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineStartWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderInlineStartWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderInlineWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderInlineWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderLeftWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderLeftWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderRightWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderRightWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderStartWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderStartWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderTopWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderTopWidth";
};

template <>
struct CSSPropDefinition<CSSProp::BorderVerticalWidth>
    : CSSPropDefinition<CSSProp::BorderWidth> {
  constexpr static std::string_view kName = "borderVerticalWidth";
};

/**
 * CSS "direction" property.
 * https://www.w3.org/TR/css-writing-modes-3/#direction
 */
template <>
struct CSSPropDefinition<CSSProp::Direction> {
  constexpr static std::string_view kName = "direction";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Ltr = to_underlying(CSSKeyword::Ltr),
    Rtl = to_underlying(CSSKeyword::Rtl),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return true;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Ltr);
  }
};

/**
 * CSS "display" property.
 * https://www.w3.org/TR/css-display-3/#display-type
 */
template <>
struct CSSPropDefinition<CSSProp::Display> {
  constexpr static std::string_view kName = "display";

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

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor flavor) {
    return flavor == CSSFlavor::W3C ? DeclaredValue::keyword(Keyword::Inline)
                                    : DeclaredValue::keyword(Keyword::Flex);
  }
};

/**
 * CSS "flex" shorthand property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-property
 *
 * React Native's interpretation of this prop is currently different than in
 * CSS. https://reactnative.dev/docs/layout-props#flex
 */
template <>
struct CSSPropDefinition<CSSProp::Flex> {
  constexpr static std::string_view kName = "flex";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    None = to_underlying(CSSKeyword::None),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword, CSSNumber>;
  using SpecifiedValue = CSSValueVariant<Keyword, CSSNumber>;
  using ComputedValue = CSSValueVariant<Keyword, CSSNumber>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::number(0.0f);
  }
};

/**
 * CSS "flex-basis" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-basis-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexBasis> {
  constexpr static std::string_view kName = "flexBasis";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    Content = to_underlying(CSSKeyword::Content),
  };

  using DeclaredValue =
      CSSValueVariant<CSSWideKeyword, Keyword, CSSLength, CSSPercentage>;
  using SpecifiedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Auto);
  }
};

/**
 * CSS "flex-direction" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-direction-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexDirection> {
  constexpr static std::string_view kName = "flexDirection";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Row = to_underlying(CSSKeyword::Row),
    RowReverse = to_underlying(CSSKeyword::RowReverse),
    Column = to_underlying(CSSKeyword::Column),
    ColumnReverse = to_underlying(CSSKeyword::ColumnReverse),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor flavor) {
    return flavor == CSSFlavor::W3C ? DeclaredValue::keyword(Keyword::Row)
                                    : DeclaredValue::keyword(Keyword::Column);
  }
};

/**
 * CSS "flex-grow" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-grow-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexGrow> {
  constexpr static std::string_view kName = "flexGrow";

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, CSSNumber>;
  using SpecifiedValue = CSSValueVariant<CSSNumber>;
  using ComputedValue = CSSValueVariant<CSSNumber>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::number(0.0f);
  }
};

/**
 * CSS "flex-shrink" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-shrink-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexShrink> {
  constexpr static std::string_view kName = "flexShrink";

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, CSSNumber>;
  using SpecifiedValue = CSSValueVariant<CSSNumber>;
  using ComputedValue = CSSValueVariant<CSSNumber>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor flavor) {
    return flavor == CSSFlavor::W3C ? DeclaredValue::number(1.0f)
                                    : DeclaredValue::number(0.0f);
  }
};

/**
 * CSS "flex-wrap" property.
 * https://www.w3.org/TR/css-flexbox-1/#flex-wrap-property
 */
template <>
struct CSSPropDefinition<CSSProp::FlexWrap> {
  constexpr static std::string_view kName = "flexWrap";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    NoWrap = to_underlying(CSSKeyword::NoWrap),
    Wrap = to_underlying(CSSKeyword::Wrap),
    WrapReverse = to_underlying(CSSKeyword::WrapReverse),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::NoWrap);
  }
};

/**
 * CSS gutter properties.
 * https://www.w3.org/TR/css-align-3/#column-row-gap
 */
template <>
struct CSSPropDefinition<CSSProp::Gap> {
  constexpr static std::string_view kName = "gap";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Normal = to_underlying(CSSKeyword::Normal),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword, CSSLength>;
  using SpecifiedValue = CSSValueVariant<Keyword, CSSLength>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Normal);
  }
};

template <>
struct CSSPropDefinition<CSSProp::ColumnGap> : CSSPropDefinition<CSSProp::Gap> {
  constexpr static std::string_view kName = "columnGap";
};

template <>
struct CSSPropDefinition<CSSProp::RowGap> : CSSPropDefinition<CSSProp::Gap> {
  constexpr static std::string_view kName = "rowGap";
};

/**
 * CSS sizing properties
 * https://www.w3.org/TR/css-sizing-3/#sizing-properties
 */
template <>
struct CSSPropDefinition<CSSProp::Height> {
  constexpr static std::string_view kName = "height";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    MaxContent = to_underlying(CSSKeyword::MaxContent),
    MinContent = to_underlying(CSSKeyword::MinContent),
  };

  using DeclaredValue =
      CSSValueVariant<CSSWideKeyword, Keyword, CSSLength, CSSPercentage>;
  using SpecifiedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Auto);
  }
};

template <>
struct CSSPropDefinition<CSSProp::Width> : CSSPropDefinition<CSSProp::Height> {
  constexpr static std::string_view kName = "width";
};

template <>
struct CSSPropDefinition<CSSProp::MinWidth>
    : CSSPropDefinition<CSSProp::Height> {
  constexpr static std::string_view kName = "minWidth";
};

template <>
struct CSSPropDefinition<CSSProp::MinHeight>
    : CSSPropDefinition<CSSProp::Height> {
  constexpr static std::string_view kName = "minHeight";
};

template <>
struct CSSPropDefinition<CSSProp::MaxWidth>
    : CSSPropDefinition<CSSProp::Height> {
  constexpr static std::string_view kName = "maxWidth";
};

template <>
struct CSSPropDefinition<CSSProp::MaxHeight>
    : CSSPropDefinition<CSSProp::Height> {
  constexpr static std::string_view kName = "maxHeight";
};

/**
 * CSS box inset properties
 * https://drafts.csswg.org/css-position-3/#insets
 */
template <>
struct CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "inset";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
  };

  using DeclaredValue =
      CSSValueVariant<CSSWideKeyword, Keyword, CSSLength, CSSPercentage>;
  using SpecifiedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Auto);
  }
};

template <>
struct CSSPropDefinition<CSSProp::Top> : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "top";
};

template <>
struct CSSPropDefinition<CSSProp::Right> : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "right";
};

template <>
struct CSSPropDefinition<CSSProp::Bottom> : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "bottom";
};

template <>
struct CSSPropDefinition<CSSProp::Left> : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "left";
};

template <>
struct CSSPropDefinition<CSSProp::Start> : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "start";
};

template <>
struct CSSPropDefinition<CSSProp::End> : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "end";
};

template <>
struct CSSPropDefinition<CSSProp::InsetBlock>
    : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "insetBlock";
};

template <>
struct CSSPropDefinition<CSSProp::InsetBlockEnd>
    : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "insetBlockEnd";
};

template <>
struct CSSPropDefinition<CSSProp::InsetBlockStart>
    : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "insetBlockStart";
};

template <>
struct CSSPropDefinition<CSSProp::InsetInline>
    : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "insetInline";
};

template <>
struct CSSPropDefinition<CSSProp::InsetInlineEnd>
    : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "insetInlineEnd";
};

template <>
struct CSSPropDefinition<CSSProp::InsetInlineStart>
    : CSSPropDefinition<CSSProp::Inset> {
  constexpr static std::string_view kName = "insetInlineStart";
};

/**
 * CSS "justify-content" property.
 * https://www.w3.org/TR/css-flexbox-1/#justify-content-property
 * https://www.w3.org/TR/css-align-3/#align-justify-content
 */
template <>
struct CSSPropDefinition<CSSProp::JustifyContent> {
  constexpr static std::string_view kName = "justifyContent";

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

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::FlexStart);
  }
};

/**
 * CSS "margin" properties
 * https://www.w3.org/TR/css-box-4/#margins
 */
template <>
struct CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "margin";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
  };

  using DeclaredValue =
      CSSValueVariant<CSSWideKeyword, Keyword, CSSLength, CSSPercentage>;
  using SpecifiedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<Keyword, CSSLength, CSSPercentage>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::length(0.0f, CSSLengthUnit::Px);
  }
};

template <>
struct CSSPropDefinition<CSSProp::MarginBlock>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginBlock";
};

template <>
struct CSSPropDefinition<CSSProp::MarginBlockEnd>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginBlockEnd";
};

template <>
struct CSSPropDefinition<CSSProp::MarginBlockStart>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginBlockStart";
};

template <>
struct CSSPropDefinition<CSSProp::MarginBottom>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginBottom";
};

template <>
struct CSSPropDefinition<CSSProp::MarginEnd>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginEnd";
};

template <>
struct CSSPropDefinition<CSSProp::MarginHorizontal>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginHorizontal";
};

template <>
struct CSSPropDefinition<CSSProp::MarginInline>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginInline";
};

template <>
struct CSSPropDefinition<CSSProp::MarginInlineEnd>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginInlineEnd";
};

template <>
struct CSSPropDefinition<CSSProp::MarginInlineStart>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginInlineStart";
};

template <>
struct CSSPropDefinition<CSSProp::MarginLeft>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginLeft";
};

template <>
struct CSSPropDefinition<CSSProp::MarginRight>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginRight";
};

template <>
struct CSSPropDefinition<CSSProp::MarginStart>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginStart";
};

template <>
struct CSSPropDefinition<CSSProp::MarginTop>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginTop";
};

template <>
struct CSSPropDefinition<CSSProp::MarginVertical>
    : CSSPropDefinition<CSSProp::Margin> {
  constexpr static std::string_view kName = "marginVertical";
};

/**
 * CSS "opacity" property
 * https://www.w3.org/TR/css-color-3/#transparency
 */
template <>
struct CSSPropDefinition<CSSProp::Opacity> {
  constexpr static std::string_view kName = "opacity";

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, CSSNumber>;
  using SpecifiedValue = CSSValueVariant<CSSNumber>;
  using ComputedValue = CSSValueVariant<CSSNumber>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::number(1.0f);
  }
};

/**
 * CSS "overflow" property.
 * https://www.w3.org/TR/css-overflow-3/#overflow-control
 */
template <>
struct CSSPropDefinition<CSSProp::Overflow> {
  constexpr static std::string_view kName = "overflow";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Auto = to_underlying(CSSKeyword::Auto),
    Clip = to_underlying(CSSKeyword::Clip),
    Hidden = to_underlying(CSSKeyword::Hidden),
    Scroll = to_underlying(CSSKeyword::Scroll),
    Visible = to_underlying(CSSKeyword::Visible),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::keyword(Keyword::Visible);
  }
};

/**
 * CSS padding properties
 * https://www.w3.org/TR/css-box-4/#paddings
 */
template <>
struct CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "padding";

  using DeclaredValue =
      CSSValueVariant<CSSWideKeyword, CSSLength, CSSPercentage>;
  using SpecifiedValue = CSSValueVariant<CSSLength, CSSPercentage>;
  using ComputedValue = CSSValueVariant<CSSLength, CSSPercentage>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor /*flavor*/) {
    return DeclaredValue::length(0.0f, CSSLengthUnit::Px);
  }
};

template <>
struct CSSPropDefinition<CSSProp::PaddingBlock>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingBlock";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingBlockEnd>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingBlockEnd";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingBlockStart>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingBlockStart";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingBottom>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingBottom";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingEnd>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingEnd";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingHorizontal>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingHorizontal";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingInline>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingInline";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingInlineEnd>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingInlineEnd";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingInlineStart>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingInlineStart";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingLeft>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingLeft";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingRight>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingRight";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingStart>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingStart";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingTop>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingTop";
};

template <>
struct CSSPropDefinition<CSSProp::PaddingVertical>
    : CSSPropDefinition<CSSProp::Padding> {
  constexpr static std::string_view kName = "paddingVertical";
};

/**
 * CSS "position" property.
 * https://www.w3.org/TR/css-position-3/#position-property
 */
template <>
struct CSSPropDefinition<CSSProp::Position> {
  constexpr static std::string_view kName = "position";

  enum class Keyword : std::underlying_type_t<CSSKeyword> {
    Static = to_underlying(CSSKeyword::Static),
    Relative = to_underlying(CSSKeyword::Relative),
    Absolute = to_underlying(CSSKeyword::Absolute),
    Fixed = to_underlying(CSSKeyword::Fixed),
    Sticky = to_underlying(CSSKeyword::Sticky),
  };

  using DeclaredValue = CSSValueVariant<CSSWideKeyword, Keyword>;
  using SpecifiedValue = CSSValueVariant<Keyword>;
  using ComputedValue = CSSValueVariant<Keyword>;

  constexpr static bool isInherited() {
    return false;
  }

  constexpr static DeclaredValue initialValue(CSSFlavor flavor) {
    return flavor == CSSFlavor::W3C ? DeclaredValue::keyword(Keyword::Static)
                                    : DeclaredValue::keyword(Keyword::Relative);
  }
};

} // namespace facebook::react
