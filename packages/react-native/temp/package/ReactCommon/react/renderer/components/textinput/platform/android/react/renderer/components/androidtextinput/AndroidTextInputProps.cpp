/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputProps.h"
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/utils/CoreFeatures.h>

namespace facebook::react {

static bool
hasValue(const RawProps& rawProps, bool defaultValue, const char* name) {
  auto rawValue = rawProps.at(name, nullptr, nullptr);

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
    : BaseTextInputProps(context, sourceProps, rawProps),
      autoComplete(CoreFeatures::enablePropIteratorSetter? sourceProps.autoComplete : convertRawProp(
          context,
          rawProps,
          "autoComplete",
          sourceProps.autoComplete,
          {})),
      returnKeyLabel(CoreFeatures::enablePropIteratorSetter? sourceProps.autoComplete : convertRawProp(context, rawProps,
          "returnKeyLabel",
          sourceProps.returnKeyLabel,
          {})),
      numberOfLines(CoreFeatures::enablePropIteratorSetter? sourceProps.numberOfLines : convertRawProp(context, rawProps,
          "numberOfLines",
          sourceProps.numberOfLines,
          {0})),
      disableFullscreenUI(CoreFeatures::enablePropIteratorSetter? sourceProps.disableFullscreenUI : convertRawProp(context, rawProps,
          "disableFullscreenUI",
          sourceProps.disableFullscreenUI,
          {false})),
      textBreakStrategy(CoreFeatures::enablePropIteratorSetter? sourceProps.textBreakStrategy : convertRawProp(context, rawProps,
          "textBreakStrategy",
          sourceProps.textBreakStrategy,
          {})),
      inlineImageLeft(CoreFeatures::enablePropIteratorSetter? sourceProps.inlineImageLeft : convertRawProp(context, rawProps,
          "inlineImageLeft",
          sourceProps.inlineImageLeft,
          {})),
      inlineImagePadding(CoreFeatures::enablePropIteratorSetter? sourceProps.inlineImagePadding : convertRawProp(context, rawProps,
          "inlineImagePadding",
          sourceProps.inlineImagePadding,
          {0})),
      importantForAutofill(CoreFeatures::enablePropIteratorSetter? sourceProps.importantForAutofill : convertRawProp(context, rawProps,
          "importantForAutofill",
          sourceProps.importantForAutofill,
          {})),
      showSoftInputOnFocus(CoreFeatures::enablePropIteratorSetter? sourceProps.showSoftInputOnFocus : convertRawProp(context, rawProps,
          "showSoftInputOnFocus",
          sourceProps.showSoftInputOnFocus,
          {false})),
      autoCorrect(CoreFeatures::enablePropIteratorSetter? sourceProps.autoCorrect : convertRawProp(context, rawProps,
          "autoCorrect",
          sourceProps.autoCorrect,
          {false})),
      allowFontScaling(CoreFeatures::enablePropIteratorSetter? sourceProps.allowFontScaling : convertRawProp(context, rawProps,
          "allowFontScaling",
          sourceProps.allowFontScaling,
          {false})),
      maxFontSizeMultiplier(CoreFeatures::enablePropIteratorSetter? sourceProps.maxFontSizeMultiplier : convertRawProp(context, rawProps,
          "maxFontSizeMultiplier",
          sourceProps.maxFontSizeMultiplier,
          {0.0})),
      editable(CoreFeatures::enablePropIteratorSetter? sourceProps.editable :
          convertRawProp(context, rawProps, "editable", sourceProps.editable, {false})),
      keyboardType(CoreFeatures::enablePropIteratorSetter? sourceProps.keyboardType : convertRawProp(context, rawProps,
          "keyboardType",
          sourceProps.keyboardType,
          {})),
      returnKeyType(CoreFeatures::enablePropIteratorSetter? sourceProps.returnKeyType : convertRawProp(context, rawProps,
          "returnKeyType",
          sourceProps.returnKeyType,
          {})),
      multiline(CoreFeatures::enablePropIteratorSetter? sourceProps.multiline : convertRawProp(context, rawProps,
          "multiline",
          sourceProps.multiline,
          {false})),
      secureTextEntry(CoreFeatures::enablePropIteratorSetter? sourceProps.secureTextEntry : convertRawProp(context, rawProps,
          "secureTextEntry",
          sourceProps.secureTextEntry,
          {false})),
      value(CoreFeatures::enablePropIteratorSetter? sourceProps.value : convertRawProp(context, rawProps, "value", sourceProps.value, {})),
      selectTextOnFocus(CoreFeatures::enablePropIteratorSetter? sourceProps.selectTextOnFocus : convertRawProp(context, rawProps,
          "selectTextOnFocus",
          sourceProps.selectTextOnFocus,
          {false})),
      submitBehavior(CoreFeatures::enablePropIteratorSetter? sourceProps.submitBehavior : convertRawProp(context, rawProps,
           "submitBehavior",
          sourceProps.submitBehavior,
          {})),
      caretHidden(CoreFeatures::enablePropIteratorSetter? sourceProps.caretHidden : convertRawProp(context, rawProps,
          "caretHidden",
          sourceProps.caretHidden,
          {false})),
      contextMenuHidden(CoreFeatures::enablePropIteratorSetter? sourceProps.contextMenuHidden : convertRawProp(context, rawProps,
          "contextMenuHidden",
          sourceProps.contextMenuHidden,
          {false})),
      textShadowColor(CoreFeatures::enablePropIteratorSetter? sourceProps.textShadowColor : convertRawProp(context, rawProps,
          "textShadowColor",
          sourceProps.textShadowColor,
          {})),
      textShadowRadius(CoreFeatures::enablePropIteratorSetter? sourceProps.textShadowRadius : convertRawProp(context, rawProps,
          "textShadowRadius",
          sourceProps.textShadowRadius,
          {0.0})),
      textDecorationLine(CoreFeatures::enablePropIteratorSetter? sourceProps.textDecorationLine : convertRawProp(context, rawProps,
          "textDecorationLine",
          sourceProps.textDecorationLine,
          {})),
      fontStyle(CoreFeatures::enablePropIteratorSetter? sourceProps.fontStyle :
          convertRawProp(context, rawProps, "fontStyle", sourceProps.fontStyle, {})),
      textShadowOffset(CoreFeatures::enablePropIteratorSetter? sourceProps.textShadowOffset : convertRawProp(context, rawProps,
          "textShadowOffset",
          sourceProps.textShadowOffset,
          {})),
      lineHeight(CoreFeatures::enablePropIteratorSetter? sourceProps.lineHeight : convertRawProp(context, rawProps,
          "lineHeight",
          sourceProps.lineHeight,
          {0.0})),
      textTransform(CoreFeatures::enablePropIteratorSetter? sourceProps.textTransform : convertRawProp(context, rawProps,
          "textTransform",
          sourceProps.textTransform,
          {})),
      color(0 /*convertRawProp(context, rawProps, "color", sourceProps.color, {0})*/),
      letterSpacing(CoreFeatures::enablePropIteratorSetter? sourceProps.letterSpacing : convertRawProp(context, rawProps,
          "letterSpacing",
          sourceProps.letterSpacing,
          {0.0})),
      fontSize(CoreFeatures::enablePropIteratorSetter? sourceProps.fontSize :
          convertRawProp(context, rawProps, "fontSize", sourceProps.fontSize, {0.0})),
      textAlign(CoreFeatures::enablePropIteratorSetter? sourceProps.textAlign :
          convertRawProp(context, rawProps, "textAlign", sourceProps.textAlign, {})),
      includeFontPadding(CoreFeatures::enablePropIteratorSetter? sourceProps.includeFontPadding : convertRawProp(context, rawProps,
          "includeFontPadding",
          sourceProps.includeFontPadding,
          {false})),
      fontWeight(CoreFeatures::enablePropIteratorSetter? sourceProps.fontWeight :
          convertRawProp(context, rawProps, "fontWeight", sourceProps.fontWeight, {})),
      fontFamily(CoreFeatures::enablePropIteratorSetter? sourceProps.fontFamily :
          convertRawProp(context, rawProps, "fontFamily", sourceProps.fontFamily, {})),
      // See AndroidTextInputComponentDescriptor for usage
      // TODO T63008435: can these, and this feature, be removed entirely?
      hasPadding(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPadding : hasValue(rawProps, sourceProps.hasPadding, "padding")),
      hasPaddingHorizontal(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPaddingHorizontal : hasValue(
          rawProps,
          sourceProps.hasPaddingHorizontal,
          "paddingHorizontal")),
      hasPaddingVertical(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPaddingVertical : hasValue(
          rawProps,
          sourceProps.hasPaddingVertical,
          "paddingVertical")),
      hasPaddingLeft(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPaddingLeft : hasValue(
          rawProps,
          sourceProps.hasPaddingLeft,
          "paddingLeft")),
      hasPaddingTop(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPaddingTop :
          hasValue(rawProps, sourceProps.hasPaddingTop, "paddingTop")),
      hasPaddingRight(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPaddingRight : hasValue(
          rawProps,
          sourceProps.hasPaddingRight,
          "paddingRight")),
      hasPaddingBottom(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPaddingBottom : hasValue(
          rawProps,
          sourceProps.hasPaddingBottom,
          "paddingBottom")),
      hasPaddingStart(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPaddingStart : hasValue(
          rawProps,
          sourceProps.hasPaddingStart,
          "paddingStart")),
      hasPaddingEnd(CoreFeatures::enablePropIteratorSetter? sourceProps.hasPaddingEnd :
          hasValue(rawProps, sourceProps.hasPaddingEnd, "paddingEnd")) {
}

void AndroidTextInputProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  BaseTextInputProps::setProp(context, hash, propName, value);

  static auto defaults = AndroidTextInputProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoComplete);
    RAW_SET_PROP_SWITCH_CASE_BASIC(returnKeyLabel);
    RAW_SET_PROP_SWITCH_CASE_BASIC(numberOfLines);
    RAW_SET_PROP_SWITCH_CASE_BASIC(disableFullscreenUI);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textBreakStrategy);
    RAW_SET_PROP_SWITCH_CASE_BASIC(inlineImageLeft);
    RAW_SET_PROP_SWITCH_CASE_BASIC(inlineImagePadding);
    RAW_SET_PROP_SWITCH_CASE_BASIC(importantForAutofill);
    RAW_SET_PROP_SWITCH_CASE_BASIC(showSoftInputOnFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoCorrect);
    RAW_SET_PROP_SWITCH_CASE_BASIC(allowFontScaling);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maxFontSizeMultiplier);
    RAW_SET_PROP_SWITCH_CASE_BASIC(editable);
    RAW_SET_PROP_SWITCH_CASE_BASIC(keyboardType);
    RAW_SET_PROP_SWITCH_CASE_BASIC(returnKeyType);
    RAW_SET_PROP_SWITCH_CASE_BASIC(multiline);
    RAW_SET_PROP_SWITCH_CASE_BASIC(secureTextEntry);
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectTextOnFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(submitBehavior);
    RAW_SET_PROP_SWITCH_CASE_BASIC(caretHidden);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contextMenuHidden);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowRadius);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textDecorationLine);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontStyle);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowOffset);
    RAW_SET_PROP_SWITCH_CASE_BASIC(lineHeight);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textTransform);
    // RAW_SET_PROP_SWITCH_CASE_BASIC(color);
    RAW_SET_PROP_SWITCH_CASE_BASIC(letterSpacing);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontSize);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textAlign);
    RAW_SET_PROP_SWITCH_CASE_BASIC(includeFontPadding);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontWeight);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontFamily);

    case CONSTEXPR_RAW_PROPS_KEY_HASH("value"): {
      fromRawValue(context, value, this->value, {});
      return;
    }

    // Paddings are not parsed at this level of the component (they're parsed in
    // ViewProps) but we do need to know if they're present or not. See
    // AndroidTextInputComponentDescriptor for usage
    // TODO T63008435: can these, and this feature, be removed entirely?
    case CONSTEXPR_RAW_PROPS_KEY_HASH("padding"): {
      hasPadding = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingHorizontal"): {
      hasPaddingHorizontal = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingVertical"): {
      hasPaddingVertical = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingLeft"): {
      hasPaddingLeft = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingRight"): {
      hasPaddingRight = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingTop"): {
      hasPaddingTop = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingBottom"): {
      hasPaddingBottom = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingStart"): {
      hasPaddingStart = value.hasValue();
      return;
    }
    case CONSTEXPR_RAW_PROPS_KEY_HASH("paddingEnd"): {
      hasPaddingEnd = value.hasValue();
      return;
    }
  }
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
  props["selectionHandleColor"] = toAndroidRepr(selectionHandleColor);
  props["value"] = value;
  props["defaultValue"] = defaultValue;
  props["selectTextOnFocus"] = selectTextOnFocus;
  props["submitBehavior"] = submitBehavior;
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

} // namespace facebook::react
