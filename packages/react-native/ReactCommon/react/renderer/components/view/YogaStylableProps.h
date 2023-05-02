/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/YGStyle.h>

#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class YogaStylableProps : public Props {
  using CompactValue = facebook::yoga::detail::CompactValue;

 public:
  YogaStylableProps() = default;
  YogaStylableProps(
      const PropsParserContext &context,
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps,
      bool shouldSetRawProps = true);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

#ifdef ANDROID
  void propsDiffMapBuffer(Props const *oldProps, MapBufferBuilder &builder)
      const override;
#endif

#pragma mark - Props
  YGStyle yogaStyle{};

  // Duplicates of existing properties with different names, taking
  // precedence. E.g. "marginBlock" instead of "marginVertical"
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
      const PropsParserContext &context,
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps);
};

} // namespace react
} // namespace facebook
