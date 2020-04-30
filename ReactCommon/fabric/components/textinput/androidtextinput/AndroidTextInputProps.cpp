/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputProps.h"
#include <react/components/image/conversions.h>
#include <react/core/propsConversions.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

static bool hasValue(
    const RawProps &rawProps,
    bool defaultValue,
    const char *name,
    const char *prefix,
    const char *suffix) {
  auto rawValue = rawProps.at(name, prefix, suffix);

  // No change to prop - use default
  if (rawValue == nullptr) {
    return defaultValue;
  }

  // Value passed from JS
  if (rawValue->hasValue()) {
    return true;
  }

  // Null/undefined passed in, indicating that we should use the default
  // platform value - thereby resetting this
  return false;
}

AndroidTextInputProps::AndroidTextInputProps(
    const AndroidTextInputProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      BaseTextProps(sourceProps, rawProps),
      autoCompleteType(convertRawProp(
          rawProps,
          "autoCompleteType",
          sourceProps.autoCompleteType,
          {})),
      returnKeyLabel(convertRawProp(
          rawProps,
          "returnKeyLabel",
          sourceProps.returnKeyLabel,
          {})),
      numberOfLines(convertRawProp(
          rawProps,
          "numberOfLines",
          sourceProps.numberOfLines,
          {0})),
      disableFullscreenUI(convertRawProp(
          rawProps,
          "disableFullscreenUI",
          sourceProps.disableFullscreenUI,
          {false})),
      textBreakStrategy(convertRawProp(
          rawProps,
          "textBreakStrategy",
          sourceProps.textBreakStrategy,
          {})),
      underlineColorAndroid(convertRawProp(
          rawProps,
          "underlineColorAndroid",
          sourceProps.underlineColorAndroid,
          {})),
      inlineImageLeft(convertRawProp(
          rawProps,
          "inlineImageLeft",
          sourceProps.inlineImageLeft,
          {})),
      inlineImagePadding(convertRawProp(
          rawProps,
          "inlineImagePadding",
          sourceProps.inlineImagePadding,
          {0})),
      importantForAutofill(convertRawProp(
          rawProps,
          "importantForAutofill",
          sourceProps.importantForAutofill,
          {})),
      showSoftInputOnFocus(convertRawProp(
          rawProps,
          "showSoftInputOnFocus",
          sourceProps.showSoftInputOnFocus,
          {false})),
      autoCapitalize(convertRawProp(
          rawProps,
          "autoCapitalize",
          sourceProps.autoCapitalize,
          {})),
      autoCorrect(convertRawProp(
          rawProps,
          "autoCorrect",
          sourceProps.autoCorrect,
          {false})),
      autoFocus(convertRawProp(
          rawProps,
          "autoFocus",
          sourceProps.autoFocus,
          {false})),
      allowFontScaling(convertRawProp(
          rawProps,
          "allowFontScaling",
          sourceProps.allowFontScaling,
          {false})),
      maxFontSizeMultiplier(convertRawProp(
          rawProps,
          "maxFontSizeMultiplier",
          sourceProps.maxFontSizeMultiplier,
          {0.0})),
      editable(
          convertRawProp(rawProps, "editable", sourceProps.editable, {false})),
      keyboardType(convertRawProp(
          rawProps,
          "keyboardType",
          sourceProps.keyboardType,
          {})),
      returnKeyType(convertRawProp(
          rawProps,
          "returnKeyType",
          sourceProps.returnKeyType,
          {})),
      maxLength(
          convertRawProp(rawProps, "maxLength", sourceProps.maxLength, {0})),
      multiline(convertRawProp(
          rawProps,
          "multiline",
          sourceProps.multiline,
          {false})),
      placeholder(
          convertRawProp(rawProps, "placeholder", sourceProps.placeholder, {})),
      placeholderTextColor(convertRawProp(
          rawProps,
          "placeholderTextColor",
          sourceProps.placeholderTextColor,
          {})),
      secureTextEntry(convertRawProp(
          rawProps,
          "secureTextEntry",
          sourceProps.secureTextEntry,
          {false})),
      selectionColor(convertRawProp(
          rawProps,
          "selectionColor",
          sourceProps.selectionColor,
          {})),
      selection(
          convertRawProp(rawProps, "selection", sourceProps.selection, {})),
      value(convertRawProp(rawProps, "value", sourceProps.value, {})),
      defaultValue(convertRawProp(
          rawProps,
          "defaultValue",
          sourceProps.defaultValue,
          {})),
      selectTextOnFocus(convertRawProp(
          rawProps,
          "selectTextOnFocus",
          sourceProps.selectTextOnFocus,
          {false})),
      blurOnSubmit(convertRawProp(
          rawProps,
          "blurOnSubmit",
          sourceProps.blurOnSubmit,
          {false})),
      caretHidden(convertRawProp(
          rawProps,
          "caretHidden",
          sourceProps.caretHidden,
          {false})),
      contextMenuHidden(convertRawProp(
          rawProps,
          "contextMenuHidden",
          sourceProps.contextMenuHidden,
          {false})),
      textShadowColor(convertRawProp(
          rawProps,
          "textShadowColor",
          sourceProps.textShadowColor,
          {})),
      textShadowRadius(convertRawProp(
          rawProps,
          "textShadowRadius",
          sourceProps.textShadowRadius,
          {0.0})),
      textDecorationLine(convertRawProp(
          rawProps,
          "textDecorationLine",
          sourceProps.textDecorationLine,
          {})),
      fontStyle(
          convertRawProp(rawProps, "fontStyle", sourceProps.fontStyle, {})),
      textShadowOffset(convertRawProp(
          rawProps,
          "textShadowOffset",
          sourceProps.textShadowOffset,
          {})),
      lineHeight(convertRawProp(
          rawProps,
          "lineHeight",
          sourceProps.lineHeight,
          {0.0})),
      textTransform(convertRawProp(
          rawProps,
          "textTransform",
          sourceProps.textTransform,
          {})),
      color(convertRawProp(rawProps, "color", sourceProps.color, {0})),
      letterSpacing(convertRawProp(
          rawProps,
          "letterSpacing",
          sourceProps.letterSpacing,
          {0.0})),
      fontSize(
          convertRawProp(rawProps, "fontSize", sourceProps.fontSize, {0.0})),
      textAlign(
          convertRawProp(rawProps, "textAlign", sourceProps.textAlign, {})),
      includeFontPadding(convertRawProp(
          rawProps,
          "includeFontPadding",
          sourceProps.includeFontPadding,
          {false})),
      fontWeight(
          convertRawProp(rawProps, "fontWeight", sourceProps.fontWeight, {})),
      fontFamily(
          convertRawProp(rawProps, "fontFamily", sourceProps.fontFamily, {})),
      textAlignVertical(convertRawProp(
          rawProps,
          "textAlignVertical",
          sourceProps.textAlignVertical,
          {})),
      cursorColor(
          convertRawProp(rawProps, "cursorColor", sourceProps.cursorColor, {})),
      mostRecentEventCount(convertRawProp(
          rawProps,
          "mostRecentEventCount",
          sourceProps.mostRecentEventCount,
          {0})),
      text(convertRawProp(rawProps, "text", sourceProps.text, {})),
      paragraphAttributes(
          convertRawProp(rawProps, sourceProps.paragraphAttributes, {})),
      // See AndroidTextInputComponentDescriptor for usage
      // TODO T63008435: can these, and this feature, be removed entirely?
      hasPadding(hasValue(rawProps, sourceProps.hasPadding, "", "padding", "")),
      hasPaddingHorizontal(hasValue(
          rawProps,
          sourceProps.hasPaddingHorizontal,
          "Horizontal",
          "padding",
          "")),
      hasPaddingVertical(hasValue(
          rawProps,
          sourceProps.hasPaddingVertical,
          "Vertical",
          "padding",
          "")),
      hasPaddingLeft(hasValue(
          rawProps,
          sourceProps.hasPaddingLeft,
          "Left",
          "padding",
          "")),
      hasPaddingTop(
          hasValue(rawProps, sourceProps.hasPaddingTop, "Top", "padding", "")),
      hasPaddingRight(hasValue(
          rawProps,
          sourceProps.hasPaddingRight,
          "Right",
          "padding",
          "")),
      hasPaddingBottom(hasValue(
          rawProps,
          sourceProps.hasPaddingBottom,
          "Bottom",
          "padding",
          "")),
      hasPaddingStart(hasValue(
          rawProps,
          sourceProps.hasPaddingStart,
          "Start",
          "padding",
          "")),
      hasPaddingEnd(
          hasValue(rawProps, sourceProps.hasPaddingEnd, "End", "padding", "")) {
}

// TODO T53300085: support this in codegen; this was hand-written
folly::dynamic AndroidTextInputProps::getDynamic() const {
  folly::dynamic props = folly::dynamic::object();
  props["autoCompleteType"] = autoCompleteType;
  props["returnKeyLabel"] = returnKeyLabel;
  props["numberOfLines"] = numberOfLines;
  props["disableFullscreenUI"] = disableFullscreenUI;
  props["textBreakStrategy"] = textBreakStrategy;
  props["underlineColorAndroid"] = toDynamic(underlineColorAndroid);
  props["inlineImageLeft"] = inlineImageLeft;
  props["inlineImagePadding"] = inlineImagePadding;
  props["importantForAutofill"] = importantForAutofill;
  props["showSoftInputOnFocus"] = showSoftInputOnFocus;
  props["autoCapitalize"] = autoCapitalize;
  props["autoCorrect"] = autoCorrect;
  props["autoFocus"] = autoFocus;
  props["allowFontScaling"] = allowFontScaling;
  props["maxFontSizeMultiplier"] = maxFontSizeMultiplier;
  props["editable"] = editable;
  props["keyboardType"] = keyboardType;
  props["returnKeyType"] = returnKeyType;
  props["maxLength"] = maxLength;
  props["multiline"] = multiline;
  props["placeholder"] = placeholder;
  props["placeholderTextColor"] = toDynamic(placeholderTextColor);
  props["secureTextEntry"] = secureTextEntry;
  props["selectionColor"] = toDynamic(selectionColor);
  props["selection"] = toDynamic(selection);
  props["value"] = value;
  props["defaultValue"] = defaultValue;
  props["selectTextOnFocus"] = selectTextOnFocus;
  props["blurOnSubmit"] = blurOnSubmit;
  props["caretHidden"] = caretHidden;
  props["contextMenuHidden"] = contextMenuHidden;
  props["textShadowColor"] = toDynamic(textShadowColor);
  props["textShadowRadius"] = textShadowRadius;
  props["textDecorationLine"] = textDecorationLine;
  props["fontStyle"] = fontStyle;
  props["textShadowOffset"] = toDynamic(textShadowOffset);
  props["lineHeight"] = lineHeight;
  props["textTransform"] = textTransform;
  props["color"] = color;
  props["letterSpacing"] = letterSpacing;
  props["fontSize"] = fontSize;
  props["textAlign"] = textAlign;
  props["includeFontPadding"] = includeFontPadding;
  props["fontWeight"] = fontWeight;
  props["fontFamily"] = fontFamily;
  props["textAlignVertical"] = textAlignVertical;
  props["cursorColor"] = toDynamic(cursorColor);
  props["mostRecentEventCount"] = mostRecentEventCount;
  props["text"] = text;

  props["hasPadding"] = hasPadding;
  props["hasPaddingHorizontal"] = hasPaddingHorizontal;
  props["hasPaddingVertical"] = hasPaddingVertical;
  props["hasPaddingStart"] = hasPaddingStart;
  props["hasPaddingEnd"] = hasPaddingEnd;
  props["hasPaddingLeft"] = hasPaddingLeft;
  props["hasPaddingRight"] = hasPaddingRight;
  props["hasPaddingTop"] = hasPaddingTop;
  props["hasPaddingBottom"] = hasPaddingBottom;

  return props;
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
// TODO: codegen these
SharedDebugStringConvertibleList AndroidTextInputProps::getDebugProps() const {
  return {};
}
#endif

} // namespace react
} // namespace facebook
