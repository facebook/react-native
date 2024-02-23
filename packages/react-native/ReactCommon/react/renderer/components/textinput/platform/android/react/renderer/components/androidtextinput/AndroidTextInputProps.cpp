/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputProps.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>

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
    : ViewProps(context, sourceProps, rawProps),
      BaseTextProps(context, sourceProps, rawProps),
      autoComplete(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.autoComplete : convertRawProp(
          context,
          rawProps,
          "autoComplete",
          sourceProps.autoComplete,
          {})),
      returnKeyLabel(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.autoComplete : convertRawProp(context, rawProps,
          "returnKeyLabel",
          sourceProps.returnKeyLabel,
          {})),
      numberOfLines(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.numberOfLines : convertRawProp(context, rawProps,
          "numberOfLines",
          sourceProps.numberOfLines,
          {0})),
      disableFullscreenUI(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.disableFullscreenUI : convertRawProp(context, rawProps,
          "disableFullscreenUI",
          sourceProps.disableFullscreenUI,
          {false})),
      textBreakStrategy(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.textBreakStrategy : convertRawProp(context, rawProps,
          "textBreakStrategy",
          sourceProps.textBreakStrategy,
          {})),
      underlineColorAndroid(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.underlineColorAndroid : convertRawProp(context, rawProps,
          "underlineColorAndroid",
          sourceProps.underlineColorAndroid,
          {})),
      inlineImageLeft(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.inlineImageLeft : convertRawProp(context, rawProps,
          "inlineImageLeft",
          sourceProps.inlineImageLeft,
          {})),
      inlineImagePadding(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.inlineImagePadding : convertRawProp(context, rawProps,
          "inlineImagePadding",
          sourceProps.inlineImagePadding,
          {0})),
      importantForAutofill(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.importantForAutofill : convertRawProp(context, rawProps,
          "importantForAutofill",
          sourceProps.importantForAutofill,
          {})),
      showSoftInputOnFocus(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.showSoftInputOnFocus : convertRawProp(context, rawProps,
          "showSoftInputOnFocus",
          sourceProps.showSoftInputOnFocus,
          {false})),
      autoCapitalize(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.autoCapitalize : convertRawProp(context, rawProps,
          "autoCapitalize",
          sourceProps.autoCapitalize,
          {})),
      autoCorrect(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.autoCorrect : convertRawProp(context, rawProps,
          "autoCorrect",
          sourceProps.autoCorrect,
          {false})),
      autoFocus(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.autoFocus : convertRawProp(context, rawProps,
          "autoFocus",
          sourceProps.autoFocus,
          {false})),
      allowFontScaling(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.allowFontScaling : convertRawProp(context, rawProps,
          "allowFontScaling",
          sourceProps.allowFontScaling,
          {false})),
      maxFontSizeMultiplier(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.maxFontSizeMultiplier : convertRawProp(context, rawProps,
          "maxFontSizeMultiplier",
          sourceProps.maxFontSizeMultiplier,
          {0.0})),
      editable(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.editable :
          convertRawProp(context, rawProps, "editable", sourceProps.editable, {false})),
      keyboardType(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.keyboardType : convertRawProp(context, rawProps,
          "keyboardType",
          sourceProps.keyboardType,
          {})),
      returnKeyType(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.returnKeyType : convertRawProp(context, rawProps,
          "returnKeyType",
          sourceProps.returnKeyType,
          {})),
      maxLength(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.maxLength :
          convertRawProp(context, rawProps, "maxLength", sourceProps.maxLength, {0})),
      multiline(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.multiline : convertRawProp(context, rawProps,
          "multiline",
          sourceProps.multiline,
          {false})),
      placeholder(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.placeholder :
          convertRawProp(context, rawProps, "placeholder", sourceProps.placeholder, {})),
      placeholderTextColor(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.placeholderTextColor : convertRawProp(context, rawProps,
          "placeholderTextColor",
          sourceProps.placeholderTextColor,
          {})),
      secureTextEntry(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.secureTextEntry : convertRawProp(context, rawProps,
          "secureTextEntry",
          sourceProps.secureTextEntry,
          {false})),
      selectionColor(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.selectionColor : convertRawProp(context, rawProps,
          "selectionColor",
          sourceProps.selectionColor,
          {})),
      selectionHandleColor(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.selectionHandleColor : convertRawProp(context, rawProps,
          "selectionHandleColor",
          sourceProps.selectionHandleColor,
          {})),
      value(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.value : convertRawProp(context, rawProps, "value", sourceProps.value, {})),
      defaultValue(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.defaultValue : convertRawProp(context, rawProps,
          "defaultValue",
          sourceProps.defaultValue,
          {})),
      selectTextOnFocus(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.selectTextOnFocus : convertRawProp(context, rawProps,
          "selectTextOnFocus",
          sourceProps.selectTextOnFocus,
          {false})),
      submitBehavior(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.submitBehavior : convertRawProp(context, rawProps,
           "submitBehavior",
          sourceProps.submitBehavior,
          {})),
      caretHidden(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.caretHidden : convertRawProp(context, rawProps,
          "caretHidden",
          sourceProps.caretHidden,
          {false})),
      contextMenuHidden(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.contextMenuHidden : convertRawProp(context, rawProps,
          "contextMenuHidden",
          sourceProps.contextMenuHidden,
          {false})),
      textShadowColor(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.textShadowColor : convertRawProp(context, rawProps,
          "textShadowColor",
          sourceProps.textShadowColor,
          {})),
      textShadowRadius(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.textShadowRadius : convertRawProp(context, rawProps,
          "textShadowRadius",
          sourceProps.textShadowRadius,
          {0.0})),
      textDecorationLine(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.textDecorationLine : convertRawProp(context, rawProps,
          "textDecorationLine",
          sourceProps.textDecorationLine,
          {})),
      fontStyle(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.fontStyle :
          convertRawProp(context, rawProps, "fontStyle", sourceProps.fontStyle, {})),
      textShadowOffset(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.textShadowOffset : convertRawProp(context, rawProps,
          "textShadowOffset",
          sourceProps.textShadowOffset,
          {})),
      lineHeight(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.lineHeight : convertRawProp(context, rawProps,
          "lineHeight",
          sourceProps.lineHeight,
          {0.0})),
      textTransform(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.textTransform : convertRawProp(context, rawProps,
          "textTransform",
          sourceProps.textTransform,
          {})),
      color(0 /*convertRawProp(context, rawProps, "color", sourceProps.color, {0})*/),
      letterSpacing(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.letterSpacing : convertRawProp(context, rawProps,
          "letterSpacing",
          sourceProps.letterSpacing,
          {0.0})),
      fontSize(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.fontSize :
          convertRawProp(context, rawProps, "fontSize", sourceProps.fontSize, {0.0})),
      textAlign(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.textAlign :
          convertRawProp(context, rawProps, "textAlign", sourceProps.textAlign, {})),
      includeFontPadding(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.includeFontPadding : convertRawProp(context, rawProps,
          "includeFontPadding",
          sourceProps.includeFontPadding,
          {false})),
      fontWeight(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.fontWeight :
          convertRawProp(context, rawProps, "fontWeight", sourceProps.fontWeight, {})),
      fontFamily(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.fontFamily :
          convertRawProp(context, rawProps, "fontFamily", sourceProps.fontFamily, {})),
      textAlignVertical(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.textAlignVertical : convertRawProp(context, rawProps,
          "textAlignVertical",
          sourceProps.textAlignVertical,
          {})),
      cursorColor(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.cursorColor :
          convertRawProp(context, rawProps, "cursorColor", sourceProps.cursorColor, {})),
      mostRecentEventCount(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.mostRecentEventCount : convertRawProp(context, rawProps,
          "mostRecentEventCount",
          sourceProps.mostRecentEventCount,
          {0})),
      text(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.text : convertRawProp(context, rawProps, "text", sourceProps.text, {})),
      paragraphAttributes(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.paragraphAttributes :
          convertRawProp(context, rawProps, sourceProps.paragraphAttributes, {})),
      // See AndroidTextInputComponentDescriptor for usage
      // TODO T63008435: can these, and this feature, be removed entirely?
      hasPadding(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPadding : hasValue(rawProps, sourceProps.hasPadding, "padding")),
      hasPaddingHorizontal(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPaddingHorizontal : hasValue(
          rawProps,
          sourceProps.hasPaddingHorizontal,
          "paddingHorizontal")),
      hasPaddingVertical(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPaddingVertical : hasValue(
          rawProps,
          sourceProps.hasPaddingVertical,
          "paddingVertical")),
      hasPaddingLeft(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPaddingLeft : hasValue(
          rawProps,
          sourceProps.hasPaddingLeft,
          "paddingLeft")),
      hasPaddingTop(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPaddingTop :
          hasValue(rawProps, sourceProps.hasPaddingTop, "paddingTop")),
      hasPaddingRight(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPaddingRight : hasValue(
          rawProps,
          sourceProps.hasPaddingRight,
          "paddingRight")),
      hasPaddingBottom(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPaddingBottom : hasValue(
          rawProps,
          sourceProps.hasPaddingBottom,
          "paddingBottom")),
      hasPaddingStart(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPaddingStart : hasValue(
          rawProps,
          sourceProps.hasPaddingStart,
          "paddingStart")),
      hasPaddingEnd(ReactNativeFeatureFlags::enablePropIteratorSetter()? sourceProps.hasPaddingEnd :
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
  ViewProps::setProp(context, hash, propName, value);
  BaseTextProps::setProp(context, hash, propName, value);

  static auto defaults = AndroidTextInputProps{};

  // ParagraphAttributes has its own switch statement - to keep all
  // of these fields together, and because there are some collisions between
  // propnames parsed here and outside of ParagraphAttributes. For example,
  // textBreakStrategy is duplicated.
  // This code is also duplicated in ParagraphProps.
  static auto paDefaults = ParagraphAttributes{};
  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        maximumNumberOfLines,
        "numberOfLines");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults, value, paragraphAttributes, ellipsizeMode, "ellipsizeMode");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        textBreakStrategy,
        "textBreakStrategy");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        adjustsFontSizeToFit,
        "adjustsFontSizeToFit");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        minimumFontSize,
        "minimumFontSize");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        maximumFontSize,
        "maximumFontSize");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        includeFontPadding,
        "includeFontPadding");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        android_hyphenationFrequency,
        "android_hyphenationFrequency");
  }

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoComplete);
    RAW_SET_PROP_SWITCH_CASE_BASIC(returnKeyLabel);
    RAW_SET_PROP_SWITCH_CASE_BASIC(numberOfLines);
    RAW_SET_PROP_SWITCH_CASE_BASIC(disableFullscreenUI);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textBreakStrategy);
    RAW_SET_PROP_SWITCH_CASE_BASIC(underlineColorAndroid);
    RAW_SET_PROP_SWITCH_CASE_BASIC(inlineImageLeft);
    RAW_SET_PROP_SWITCH_CASE_BASIC(inlineImagePadding);
    RAW_SET_PROP_SWITCH_CASE_BASIC(importantForAutofill);
    RAW_SET_PROP_SWITCH_CASE_BASIC(showSoftInputOnFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoCapitalize);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoCorrect);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(allowFontScaling);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maxFontSizeMultiplier);
    RAW_SET_PROP_SWITCH_CASE_BASIC(editable);
    RAW_SET_PROP_SWITCH_CASE_BASIC(keyboardType);
    RAW_SET_PROP_SWITCH_CASE_BASIC(returnKeyType);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maxLength);
    RAW_SET_PROP_SWITCH_CASE_BASIC(multiline);
    RAW_SET_PROP_SWITCH_CASE_BASIC(placeholder);
    RAW_SET_PROP_SWITCH_CASE_BASIC(placeholderTextColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(secureTextEntry);
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectionColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectionHandleColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(defaultValue);
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
    RAW_SET_PROP_SWITCH_CASE_BASIC(textAlignVertical);
    RAW_SET_PROP_SWITCH_CASE_BASIC(cursorColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(mostRecentEventCount);
    RAW_SET_PROP_SWITCH_CASE_BASIC(text);

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

} // namespace facebook::react
