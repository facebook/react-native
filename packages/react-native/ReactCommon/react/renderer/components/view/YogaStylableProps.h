/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/style/Style.h>

#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook::react {

class YogaStylableProps : public Props {
  using CompactValue = facebook::yoga::CompactValue;

 public:
  YogaStylableProps() = default;
  YogaStylableProps(
      const PropsParserContext& context,
      const YogaStylableProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#ifdef ANDROID
  void propsDiffMapBuffer(const Props* oldProps, MapBufferBuilder& builder)
      const override;
#endif

#pragma mark - Props
  yoga::Style yogaStyle{};

  // Duplicates of existing properties with different names, taking
  // precedence. E.g. "marginBlock" instead of "marginVertical"
  CompactValue inset;
  CompactValue insetInline;
  CompactValue insetInlineEnd;
  CompactValue insetInlineStart;

  CompactValue marginInline;
  CompactValue marginInlineStart;
  CompactValue marginInlineEnd;
  CompactValue marginBlock;

  CompactValue paddingInline;
  CompactValue paddingInlineStart;
  CompactValue paddingInlineEnd;
  CompactValue paddingBlock;

  // BlockEnd/BlockStart map to top/bottom (no writing mode), but we preserve
  // Yoga's precedence and prefer specific edges (e.g. top) to ones which are
  // flow relative (e.g. blockStart).
  CompactValue insetBlock;
  CompactValue insetBlockEnd;
  CompactValue insetBlockStart;

  CompactValue marginBlockStart;
  CompactValue marginBlockEnd;

  CompactValue paddingBlockStart;
  CompactValue paddingBlockEnd;

#if RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const override;

#endif

 private:
  void convertRawPropAliases(
      const PropsParserContext& context,
      const YogaStylableProps& sourceProps,
      const RawProps& rawProps);
};

} // namespace facebook::react
