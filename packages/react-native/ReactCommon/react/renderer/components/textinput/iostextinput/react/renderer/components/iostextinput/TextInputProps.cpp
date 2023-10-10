/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputProps.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/iostextinput/propsConversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

TextInputProps::TextInputProps(
    const PropsParserContext& context,
    const TextInputProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      BaseTextProps(context, sourceProps, rawProps),
      traits(convertRawProp(context, rawProps, sourceProps.traits, {})),
      paragraphAttributes(convertRawProp(
          context,
          rawProps,
          sourceProps.paragraphAttributes,
          {})),
      defaultValue(convertRawProp(
          context,
          rawProps,
          "defaultValue",
          sourceProps.defaultValue,
          {})),
      placeholder(convertRawProp(
          context,
          rawProps,
          "placeholder",
          sourceProps.placeholder,
          {})),
      placeholderTextColor(convertRawProp(
          context,
          rawProps,
          "placeholderTextColor",
          sourceProps.placeholderTextColor,
          {})),
      maxLength(convertRawProp(
          context,
          rawProps,
          "maxLength",
          sourceProps.maxLength,
          {})),
      cursorColor(convertRawProp(
          context,
          rawProps,
          "cursorColor",
          sourceProps.cursorColor,
          {})),
      selectionColor(convertRawProp(
          context,
          rawProps,
          "selectionColor",
          sourceProps.selectionColor,
          {})),
      underlineColorAndroid(convertRawProp(
          context,
          rawProps,
          "underlineColorAndroid",
          sourceProps.underlineColorAndroid,
          {})),
      text(convertRawProp(context, rawProps, "text", sourceProps.text, {})),
      mostRecentEventCount(convertRawProp(
          context,
          rawProps,
          "mostRecentEventCount",
          sourceProps.mostRecentEventCount,
          {})),
      autoFocus(convertRawProp(
          context,
          rawProps,
          "autoFocus",
          sourceProps.autoFocus,
          {})),
      selection(convertRawProp(
          context,
          rawProps,
          "selection",
          sourceProps.selection,
          std::optional<Selection>())),
      inputAccessoryViewID(convertRawProp(
          context,
          rawProps,
          "inputAccessoryViewID",
          sourceProps.inputAccessoryViewID,
          {})),
      onKeyPressSync(convertRawProp(
          context,
          rawProps,
          "onKeyPressSync",
          sourceProps.onKeyPressSync,
          {})),
      onChangeSync(convertRawProp(
          context,
          rawProps,
          "onChangeSync",
          sourceProps.onChangeSync,
          {})){};

void TextInputProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  ViewProps::setProp(context, hash, propName, value);
  BaseTextProps::setProp(context, hash, propName, value);
}

TextAttributes TextInputProps::getEffectiveTextAttributes(
    Float fontSizeMultiplier) const {
  auto result = TextAttributes::defaultTextAttributes();
  result.fontSizeMultiplier = fontSizeMultiplier;
  result.apply(textAttributes);

  /*
   * These props are applied to `View`, therefore they must not be a part of
   * base text attributes.
   */
  result.backgroundColor = clearColor();
  result.opacity = 1;

  return result;
}

ParagraphAttributes TextInputProps::getEffectiveParagraphAttributes() const {
  auto result = paragraphAttributes;

  if (!traits.multiline) {
    result.maximumNumberOfLines = 1;
  }

  return result;
}

} // namespace facebook::react
