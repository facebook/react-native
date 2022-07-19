/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputProps.h"
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/conversions.h>

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
    const PropsParserContext &context,
    const AndroidTextInputProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(context, sourceProps, rawProps),
      BaseTextProps(context, sourceProps, rawProps),
      autoComplete(convertRawProp(
          context,
          rawProps,
          "autoComplete",
          sourceProps.autoComplete,
          {})),
      returnKeyLabel(convertRawProp(context, rawProps,
          "returnKeyLabel",
          sourceProps.returnKeyLabel,
          {})),
      numberOfLines(convertRawProp(context, rawProps,
          "numberOfLines",
          sourceProps.numberOfLines,
          {0})),
      disableFullscreenUI(convertRawProp(context, rawProps,
          "disableFullscreenUI",
          sourceProps.disableFullscreenUI,
          {false})),
      textBreakStrategy(convertRawProp(context, rawProps,
          "textBreakStrategy",
          sourceProps.textBreakStrategy,
          {})),
      underlineColorAndroid(convertRawProp(context, rawProps,
          "underlineColorAndroid",
          sourceProps.underlineColorAndroid,
          {})),
      inlineImageLeft(convertRawProp(context, rawProps,
          "inlineImageLeft",
          sourceProps.inlineImageLeft,
          {})),
      inlineImagePadding(convertRawProp(context, rawProps,
          "inlineImagePadding",
          sourceProps.inlineImagePadding,
          {0})),
      importantForAutofill(convertRawProp(context, rawProps,
          "importantForAutofill",
          sourceProps.importantForAutofill,
          {})),
      showSoftInputOnFocus(convertRawProp(context, rawProps,
          "showSoftInputOnFocus",
          sourceProps.showSoftInputOnFocus,
          {false})),
      autoCapitalize(convertRawProp(context, rawProps,
          "autoCapitalize",
          sourceProps.autoCapitalize,
          {})),
      autoCorrect(convertRawProp(context, rawProps,
          "autoCorrect",
          sourceProps.autoCorrect,
          {false})),
      autoFocus(convertRawProp(context, rawProps,
          "autoFocus",
          sourceProps.autoFocus,
          {false})),
      allowFontScaling(convertRawProp(context, rawProps,
          "allowFontScaling",
          sourceProps.allowFontScaling,
          {false})),
      maxFontSizeMultiplier(convertRawProp(context, rawProps,
          "maxFontSizeMultiplier",
          sourceProps.maxFontSizeMultiplier,
          {0.0})),
      editable(
          convertRawProp(context, rawProps, "editable", sourceProps.editable, {false})),
      keyboardType(convertRawProp(context, rawProps,
          "keyboardType",
          sourceProps.keyboardType,
          {})),
      returnKeyType(convertRawProp(context, rawProps,
          "returnKeyType",
          sourceProps.returnKeyType,
          {})),
      maxLength(
          convertRawProp(context, rawProps, "maxLength", sourceProps.maxLength, {0})),
      multiline(convertRawProp(context, rawProps,
          "multiline",
          sourceProps.multiline,
          {false})),
      placeholder(
          convertRawProp(context, rawProps, "placeholder", sourceProps.placeholder, {})),
      placeholderTextColor(convertRawProp(context, rawProps,
          "placeholderTextColor",
          sourceProps.placeholderTextColor,
          {})),
      secureTextEntry(convertRawProp(context, rawProps,
          "secureTextEntry",
          sourceProps.secureTextEntry,
          {false})),
      selectionColor(convertRawProp(context, rawProps,
          "selectionColor",
          sourceProps.selectionColor,
          {})),
      selection(
          convertRawProp(context, rawProps, "selection", sourceProps.selection, {})),
      value(convertRawProp(context, rawProps, "value", sourceProps.value, {})),
      defaultValue(convertRawProp(context, rawProps,
          "defaultValue",
          sourceProps.defaultValue,
          {})),
      selectTextOnFocus(convertRawProp(context, rawProps,
          "selectTextOnFocus",
          sourceProps.selectTextOnFocus,
          {false})),
      blurOnSubmit(convertRawProp(context, rawProps,
          "blurOnSubmit",
          sourceProps.blurOnSubmit,
          {false})),
      caretHidden(convertRawProp(context, rawProps,
          "caretHidden",
          sourceProps.caretHidden,
          {false})),
      contextMenuHidden(convertRawProp(context, rawProps,
          "contextMenuHidden",
          sourceProps.contextMenuHidden,
          {false})),
      textShadowColor(convertRawProp(context, rawProps,
          "textShadowColor",
          sourceProps.textShadowColor,
          {})),
      textShadowRadius(convertRawProp(context, rawProps,
          "textShadowRadius",
          sourceProps.textShadowRadius,
          {0.0})),
      textDecorationLine(convertRawProp(context, rawProps,
          "textDecorationLine",
          sourceProps.textDecorationLine,
          {})),
      fontStyle(
          convertRawProp(context, rawProps, "fontStyle", sourceProps.fontStyle, {})),
      textShadowOffset(convertRawProp(context, rawProps,
          "textShadowOffset",
          sourceProps.textShadowOffset,
          {})),
      lineHeight(convertRawProp(context, rawProps,
          "lineHeight",
          sourceProps.lineHeight,
          {0.0})),
      textTransform(convertRawProp(context, rawProps,
          "textTransform",
          sourceProps.textTransform,
          {})),
      color(0 /*convertRawProp(context, rawProps, "color", sourceProps.color, {0})*/),
      letterSpacing(convertRawProp(context, rawProps,
          "letterSpacing",
          sourceProps.letterSpacing,
          {0.0})),
      fontSize(
          convertRawProp(context, rawProps, "fontSize", sourceProps.fontSize, {0.0})),
      textAlign(
          convertRawProp(context, rawProps, "textAlign", sourceProps.textAlign, {})),
      includeFontPadding(convertRawProp(context, rawProps,
          "includeFontPadding",
          sourceProps.includeFontPadding,
          {false})),
      fontWeight(
          convertRawProp(context, rawProps, "fontWeight", sourceProps.fontWeight, {})),
      fontFamily(
          convertRawProp(context, rawProps, "fontFamily", sourceProps.fontFamily, {})),
      textAlignVertical(convertRawProp(context, rawProps,
          "textAlignVertical",
          sourceProps.textAlignVertical,
          {})),
      cursorColor(
          convertRawProp(context, rawProps, "cursorColor", sourceProps.cursorColor, {})),
      mostRecentEventCount(convertRawProp(context, rawProps,
          "mostRecentEventCount",
          sourceProps.mostRecentEventCount,
          {0})),
      text(convertRawProp(context, rawProps, "text", sourceProps.text, {})),
      paragraphAttributes(
          convertRawProp(context, rawProps, sourceProps.paragraphAttributes, {})),
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
  props["autoComplete"] = autoComplete;
  props["returnKeyLabel"] = returnKeyLabel;
  props["numberOfLines"] = numberOfLines;
  props["disableFullscreenUI"] = disableFullscreenUI;
  props["textBreakStrategy"] = textBreakStrategy;
  props["underlineColorAndroid"] = toAndroidRepr(underlineColorAndroid);
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
  props["placeholderTextColor"] = toAndroidRepr(placeholderTextColor);
  props["secureTextEntry"] = secureTextEntry;
  props["selectionColor"] = toAndroidRepr(selectionColor);
  props["selection"] = toDynamic(selection);
  props["value"] = value;
  props["defaultValue"] = defaultValue;
  props["selectTextOnFocus"] = selectTextOnFocus;
  props["blurOnSubmit"] = blurOnSubmit;
  props["caretHidden"] = caretHidden;
  props["contextMenuHidden"] = contextMenuHidden;
  props["textShadowColor"] = toAndroidRepr(textShadowColor);
  props["textShadowRadius"] = textShadowRadius;
  props["textDecorationLine"] = textDecorationLine;
  props["fontStyle"] = fontStyle;
  props["textShadowOffset"] = toDynamic(textShadowOffset);
  props["lineHeight"] = lineHeight;
  props["textTransform"] = textTransform;
  props["color"] = toAndroidRepr(color);
  props["letterSpacing"] = letterSpacing;
  props["fontSize"] = fontSize;
  props["textAlign"] = textAlign;
  props["includeFontPadding"] = includeFontPadding;
  props["fontWeight"] = fontWeight;
  props["fontFamily"] = fontFamily;
  props["textAlignVertical"] = textAlignVertical;
  props["cursorColor"] = toAndroidRepr(cursorColor);
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
