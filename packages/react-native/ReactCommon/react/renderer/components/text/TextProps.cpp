/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextProps.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/DebugStringConvertibleItem.h>
#include <react/utils/CoreFeatures.h>

namespace facebook::react {

static SpanAttributes convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const SpanAttributes& sourceSpanAttributes,
    const SpanAttributes& defaultSpanAttributes) {
  auto spanAttributes = SpanAttributes{};

  spanAttributes.fillLineGap = convertRawProp(
      context,
      rawProps,
      "fillLineGap",
      sourceSpanAttributes.fillLineGap,
      defaultSpanAttributes.fillLineGap);

  return spanAttributes;
}

TextProps::TextProps(
    const PropsParserContext& context,
    const TextProps& sourceProps,
    const RawProps& rawProps)
    : Props(context, sourceProps, rawProps),
      BaseTextProps::BaseTextProps(context, sourceProps, rawProps),
      spanAttributes{
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.spanAttributes
              : convertRawProp(
                    context,
                    rawProps,
                    sourceProps.spanAttributes,
                    SpanAttributes{})} {}

void TextProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  BaseTextProps::setProp(context, hash, propName, value);
  Props::setProp(context, hash, propName, value);

  static auto defaultSpanAttributes = SpanAttributes::defaultSpanAttributes();

  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE(
        defaultSpanAttributes,
        value,
        spanAttributes,
        fillLineGap,
        "fillLineGap");
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList TextProps::getDebugProps() const {
  return BaseTextProps::getDebugProps();
}
#endif

} // namespace facebook::react
