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
      autoComplete(Props::enablePropIteratorSetter ? sourceProps.autoComplete : convertRawProp(
          context,
          rawProps,
          "autoComplete",
          sourceProps.autoComplete,
          {})),
      returnKeyLabel(Props::enablePropIteratorSetter ? sourceProps.autoComplete : convertRawProp(context, rawProps,
          "returnKeyLabel",
          sourceProps.returnKeyLabel,
          {})),
      numberOfLines(Props::enablePropIteratorSetter ? sourceProps.numberOfLines : convertRawProp(context, rawProps,
          "numberOfLines",
          sourceProps.numberOfLines,
          {0})),
      disableFullscreenUI(Props::enablePropIteratorSetter ? sourceProps.disableFullscreenUI : convertRawProp(context, rawProps,
          "disableFullscreenUI",
          sourceProps.disableFullscreenUI,
          {false})),
      textBreakStrategy(Props::enablePropIteratorSetter ? sourceProps.textBreakStrategy : convertRawProp(context, rawProps,
          "textBreakStrategy",
          sourceProps.textBreakStrategy,
          {})),
      underlineColorAndroid(Props::enablePropIteratorSetter ? sourceProps.underlineColorAndroid : convertRawProp(context, rawProps,
          "underlineColorAndroid",
          sourceProps.underlineColorAndroid,
          {})),
      inlineImageLeft(Props::enablePropIteratorSetter ? sourceProps.inlineImageLeft : convertRawProp(context, rawProps,
          "inlineImageLeft",
          sourceProps.inlineImageLeft,
          {})),
      inlineImagePadding(Props::enablePropIteratorSetter ? sourceProps.inlineImagePadding : convertRawProp(context, rawProps,
          "inlineImagePadding",
          sourceProps.inlineImagePadding,
          {0})),
      importantForAutofill(Props::enablePropIteratorSetter ? sourceProps.importantForAutofill : convertRawProp(context, rawProps,
          "importantForAutofill",
          sourceProps.importantForAutofill,
          {})),
      showSoftInputOnFocus(Props::enablePropIteratorSetter ? sourceProps.showSoftInputOnFocus : convertRawProp(context, rawProps,
          "showSoftInputOnFocus",
          sourceProps.showSoftInputOnFocus,
          {false})),
      autoCapitalize(Props::enablePropIteratorSetter ? sourceProps.autoCapitalize : convertRawProp(context, rawProps,
          "autoCapitalize",
          sourceProps.autoCapitalize,
          {})),
      autoCorrect(Props::enablePropIteratorSetter ? sourceProps.autoCorrect : convertRawProp(context, rawProps,
          "autoCorrect",
          sourceProps.autoCorrect,
          {false})),
      autoFocus(Props::enablePropIteratorSetter ? sourceProps.autoFocus : convertRawProp(context, rawProps,
          "autoFocus",
          sourceProps.autoFocus,
          {false})),
      allowFontScaling(Props::enablePropIteratorSetter ? sourceProps.allowFontScaling : convertRawProp(context, rawProps,
          "allowFontScaling",
          sourceProps.allowFontScaling,
          {false})),
      maxFontSizeMultiplier(Props::enablePropIteratorSetter ? sourceProps.maxFontSizeMultiplier : convertRawProp(context, rawProps,
          "maxFontSizeMultiplier",
          sourceProps.maxFontSizeMultiplier,
          {0.0})),
      editable(Props::enablePropIteratorSetter ? sourceProps.editable :
          convertRawProp(context, rawProps, "editable", sourceProps.editable, {false})),
      keyboardType(Props::enablePropIteratorSetter ? sourceProps.keyboardType : convertRawProp(context, rawProps,
          "keyboardType",
          sourceProps.keyboardType,
          {})),
      returnKeyType(Props::enablePropIteratorSetter ? sourceProps.returnKeyType : convertRawProp(context, rawProps,
          "returnKeyType",
          sourceProps.returnKeyType,
          {})),
      maxLength(Props::enablePropIteratorSetter ? sourceProps.maxLength :
          convertRawProp(context, rawProps, "maxLength", sourceProps.maxLength, {0})),
      multiline(Props::enablePropIteratorSetter ? sourceProps.multiline : convertRawProp(context, rawProps,
          "multiline",
          sourceProps.multiline,
          {false})),
      placeholder(Props::enablePropIteratorSetter ? sourceProps.placeholder :
          convertRawProp(context, rawProps, "placeholder", sourceProps.placeholder, {})),
      placeholderTextColor(Props::enablePropIteratorSetter ? sourceProps.placeholderTextColor : convertRawProp(context, rawProps,
          "placeholderTextColor",
          sourceProps.placeholderTextColor,
          {})),
      secureTextEntry(Props::enablePropIteratorSetter ? sourceProps.secureTextEntry : convertRawProp(context, rawProps,
          "secureTextEntry",
          sourceProps.secureTextEntry,
          {false})),
      selectionColor(Props::enablePropIteratorSetter ? sourceProps.selectionColor : convertRawProp(context, rawProps,
          "selectionColor",
          sourceProps.selectionColor,
          {})),
      selection(Props::enablePropIteratorSetter ? sourceProps.selection :
          convertRawProp(context, rawProps, "selection", sourceProps.selection, {})),
      value(Props::enablePropIteratorSetter ? sourceProps.value : convertRawProp(context, rawProps, "value", sourceProps.value, {})),
      defaultValue(Props::enablePropIteratorSetter ? sourceProps.defaultValue : convertRawProp(context, rawProps,
          "defaultValue",
          sourceProps.defaultValue,
          {})),
      selectTextOnFocus(Props::enablePropIteratorSetter ? sourceProps.selectTextOnFocus : convertRawProp(context, rawProps,
          "selectTextOnFocus",
          sourceProps.selectTextOnFocus,
          {false})),
      submitBehavior(Props::enablePropIteratorSetter ? sourceProps.submitBehavior : convertRawProp(context, rawProps,
           "submitBehavior",
          sourceProps.submitBehavior,
          {})),
      caretHidden(Props::enablePropIteratorSetter ? sourceProps.caretHidden : convertRawProp(context, rawProps,
          "caretHidden",
          sourceProps.caretHidden,
          {false})),
      contextMenuHidden(Props::enablePropIteratorSetter ? sourceProps.contextMenuHidden : convertRawProp(context, rawProps,
          "contextMenuHidden",
          sourceProps.contextMenuHidden,
          {false})),
      textShadowColor(Props::enablePropIteratorSetter ? sourceProps.textShadowColor : convertRawProp(context, rawProps,
          "textShadowColor",
          sourceProps.textShadowColor,
          {})),
      textShadowRadius(Props::enablePropIteratorSetter ? sourceProps.textShadowRadius : convertRawProp(context, rawProps,
          "textShadowRadius",
          sourceProps.textShadowRadius,
          {0.0})),
      textDecorationLine(Props::enablePropIteratorSetter ? sourceProps.textDecorationLine : convertRawProp(context, rawProps,
          "textDecorationLine",
          sourceProps.textDecorationLine,
          {})),
      fontStyle(Props::enablePropIteratorSetter ? sourceProps.fontStyle :
          convertRawProp(context, rawProps, "fontStyle", sourceProps.fontStyle, {})),
      textShadowOffset(Props::enablePropIteratorSetter ? sourceProps.textShadowOffset : convertRawProp(context, rawProps,
          "textShadowOffset",
          sourceProps.textShadowOffset,
          {})),
      lineHeight(Props::enablePropIteratorSetter ? sourceProps.lineHeight : convertRawProp(context, rawProps,
          "lineHeight",
          sourceProps.lineHeight,
          {0.0})),
      textTransform(Props::enablePropIteratorSetter ? sourceProps.textTransform : convertRawProp(context, rawProps,
          "textTransform",
          sourceProps.textTransform,
          {})),
      color(0 /*convertRawProp(context, rawProps, "color", sourceProps.color, {0})*/),
      letterSpacing(Props::enablePropIteratorSetter ? sourceProps.letterSpacing : convertRawProp(context, rawProps,
          "letterSpacing",
          sourceProps.letterSpacing,
          {0.0})),
      fontSize(Props::enablePropIteratorSetter ? sourceProps.fontSize :
          convertRawProp(context, rawProps, "fontSize", sourceProps.fontSize, {0.0})),
      textAlign(Props::enablePropIteratorSetter ? sourceProps.textAlign :
          convertRawProp(context, rawProps, "textAlign", sourceProps.textAlign, {})),
      includeFontPadding(Props::enablePropIteratorSetter ? sourceProps.includeFontPadding : convertRawProp(context, rawProps,
          "includeFontPadding",
          sourceProps.includeFontPadding,
          {false})),
      fontWeight(Props::enablePropIteratorSetter ? sourceProps.fontWeight :
          convertRawProp(context, rawProps, "fontWeight", sourceProps.fontWeight, {})),
      fontFamily(Props::enablePropIteratorSetter ? sourceProps.fontFamily :
          convertRawProp(context, rawProps, "fontFamily", sourceProps.fontFamily, {})),
      textAlignVertical(Props::enablePropIteratorSetter ? sourceProps.textAlignVertical : convertRawProp(context, rawProps,
          "textAlignVertical",
          sourceProps.textAlignVertical,
          {})),
      cursorColor(Props::enablePropIteratorSetter ? sourceProps.cursorColor :
          convertRawProp(context, rawProps, "cursorColor", sourceProps.cursorColor, {})),
      mostRecentEventCount(Props::enablePropIteratorSetter ? sourceProps.mostRecentEventCount : convertRawProp(context, rawProps,
          "mostRecentEventCount",
          sourceProps.mostRecentEventCount,
          {0})),
      text(Props::enablePropIteratorSetter ? sourceProps.text : convertRawProp(context, rawProps, "text", sourceProps.text, {})),
      paragraphAttributes(Props::enablePropIteratorSetter ? sourceProps.paragraphAttributes :
          convertRawProp(context, rawProps, sourceProps.paragraphAttributes, {})),
      // See AndroidTextInputComponentDescriptor for usage
      // TODO T63008435: can these, and this feature, be removed entirely?
      hasPadding(Props::enablePropIteratorSetter ? sourceProps.hasPadding : hasValue(rawProps, sourceProps.hasPadding, "", "padding", "")),
      hasPaddingHorizontal(Props::enablePropIteratorSetter ? sourceProps.hasPaddingHorizontal : hasValue(
          rawProps,
          sourceProps.hasPaddingHorizontal,
          "Horizontal",
          "padding",
          "")),
      hasPaddingVertical(Props::enablePropIteratorSetter ? sourceProps.hasPaddingVertical : hasValue(
          rawProps,
          sourceProps.hasPaddingVertical,
          "Vertical",
          "padding",
          "")),
      hasPaddingLeft(Props::enablePropIteratorSetter ? sourceProps.hasPaddingLeft : hasValue(
          rawProps,
          sourceProps.hasPaddingLeft,
          "Left",
          "padding",
          "")),
      hasPaddingTop(Props::enablePropIteratorSetter ? sourceProps.hasPaddingTop :
          hasValue(rawProps, sourceProps.hasPaddingTop, "Top", "padding", "")),
      hasPaddingRight(Props::enablePropIteratorSetter ? sourceProps.hasPaddingRight : hasValue(
          rawProps,
          sourceProps.hasPaddingRight,
          "Right",
          "padding",
          "")),
      hasPaddingBottom(Props::enablePropIteratorSetter ? sourceProps.hasPaddingBottom : hasValue(
          rawProps,
          sourceProps.hasPaddingBottom,
          "Bottom",
          "padding",
          "")),
      hasPaddingStart(Props::enablePropIteratorSetter ? sourceProps.hasPaddingStart : hasValue(
          rawProps,
          sourceProps.hasPaddingStart,
          "Start",
          "padding",
          "")),
      hasPaddingEnd(Props::enablePropIteratorSetter ? sourceProps.hasPaddingEnd :
          hasValue(rawProps, sourceProps.hasPaddingEnd, "End", "padding", "")) {
}

void AndroidTextInputProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  ViewProps::setProp(context, hash, propName, value);
  BaseTextProps::setProp(context, hash, propName, value);

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
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoComplete, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(returnKeyLabel, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(numberOfLines, 0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(disableFullscreenUI, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textBreakStrategy, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(underlineColorAndroid, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(inlineImageLeft, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(inlineImagePadding, 0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(importantForAutofill, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(showSoftInputOnFocus, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoCapitalize, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoCorrect, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(autoFocus, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(allowFontScaling, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maxFontSizeMultiplier, (Float)0.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(editable, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(keyboardType, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(returnKeyType, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(maxLength, 0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(multiline, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(placeholder, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(placeholderTextColor, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(secureTextEntry, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectionColor, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(selection, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(this->value, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(defaultValue, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(selectTextOnFocus, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(submitBehavior, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(caretHidden, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contextMenuHidden, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowColor, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowRadius, (Float)0.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textDecorationLine, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontStyle, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(textShadowOffset, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(lineHeight, (Float)0.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textTransform, {});
    // RAW_SET_PROP_SWITCH_CASE_BASIC(color, {0}); // currently not being parsed
    RAW_SET_PROP_SWITCH_CASE_BASIC(letterSpacing, (Float)0.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontSize, (Float)0.0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(textAlign, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(includeFontPadding, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontWeight, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(fontFamily, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(textAlignVertical, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(cursorColor, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(mostRecentEventCount, 0);
    RAW_SET_PROP_SWITCH_CASE_BASIC(text, {});

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
  props["selection"] = toDynamic(selection);
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

} // namespace react
} // namespace facebook
