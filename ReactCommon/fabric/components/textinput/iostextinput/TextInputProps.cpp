/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputProps.h"

#include <react/attributedstring/conversions.h>
#include <react/components/iostextinput/propsConversions.h>
#include <react/core/propsConversions.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

TextInputProps::TextInputProps(
    TextInputProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps),
      BaseTextProps(sourceProps, rawProps),
      traits(convertRawProp(rawProps, sourceProps.traits, {})),
      paragraphAttributes(
          convertRawProp(rawProps, sourceProps.paragraphAttributes, {})),
      defaultValue(convertRawProp(
          rawProps,
          "defaultValue",
          sourceProps.defaultValue,
          {})),
      placeholder(
          convertRawProp(rawProps, "placeholder", sourceProps.placeholder, {})),
      placeholderTextColor(convertRawProp(
          rawProps,
          "placeholderTextColor",
          sourceProps.placeholderTextColor,
          {})),
      maxLength(
          convertRawProp(rawProps, "maxLength", sourceProps.maxLength, {})),
      cursorColor(
          convertRawProp(rawProps, "cursorColor", sourceProps.cursorColor, {})),
      selectionColor(convertRawProp(
          rawProps,
          "selectionColor",
          sourceProps.selectionColor,
          {})),
      underlineColorAndroid(convertRawProp(
          rawProps,
          "underlineColorAndroid",
          sourceProps.underlineColorAndroid,
          {})),
      text(convertRawProp(rawProps, "text", sourceProps.text, {})),
      mostRecentEventCount(convertRawProp(
          rawProps,
          "mostRecentEventCount",
          sourceProps.mostRecentEventCount,
          {})){};

TextAttributes TextInputProps::getEffectiveTextAttributes() const {
  auto result = TextAttributes::defaultTextAttributes();
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

#ifdef ANDROID
folly::dynamic TextInputProps::getDynamic() const {
  folly::dynamic props = folly::dynamic::object();
  props["value"] = value;
  return props;
}
#endif

} // namespace react
} // namespace facebook
