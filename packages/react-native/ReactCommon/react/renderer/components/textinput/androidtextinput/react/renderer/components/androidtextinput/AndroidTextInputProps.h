/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/Props.h>
#include <react/renderer/graphics/Color.h>

#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/text/BaseTextProps.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/imagemanager/primitives.h>
#include <cinttypes>
#include <unordered_map>
#include <vector>

namespace facebook::react {

struct AndroidTextInputTextShadowOffsetStruct {
  double width;
  double height;
};

static inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    AndroidTextInputTextShadowOffsetStruct& result) {
  auto map = (std::unordered_map<std::string, RawValue>)value;

  auto width = map.find("width");
  if (width != map.end()) {
    fromRawValue(context, width->second, result.width);
  }
  auto height = map.find("height");
  if (height != map.end()) {
    fromRawValue(context, height->second, result.height);
  }
}

static inline std::string toString(
    const AndroidTextInputTextShadowOffsetStruct& value) {
  return "[Object AndroidTextInputTextShadowOffsetStruct]";
}

#ifdef ANDROID
inline folly::dynamic toDynamic(
    const AndroidTextInputTextShadowOffsetStruct& value) {
  folly::dynamic dynamicValue = folly::dynamic::object();
  dynamicValue["width"] = value.width;
  dynamicValue["height"] = value.height;
  return dynamicValue;
}
#endif

class AndroidTextInputProps final : public ViewProps, public BaseTextProps {
 public:
  AndroidTextInputProps() = default;
  AndroidTextInputProps(
      const PropsParserContext& context,
      const AndroidTextInputProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

  folly::dynamic getDynamic() const;

#pragma mark - Props

  std::string autoComplete{};
  std::string returnKeyLabel{};
  int numberOfLines{0};
  bool disableFullscreenUI{false};
  std::string textBreakStrategy{};
  SharedColor underlineColorAndroid{};
  std::string inlineImageLeft{};
  int inlineImagePadding{0};
  std::string importantForAutofill{};
  bool showSoftInputOnFocus{false};
  std::string autoCapitalize{};
  bool autoCorrect{false};
  bool autoFocus{false};
  bool allowFontScaling{false};
  Float maxFontSizeMultiplier{0.0};
  bool editable{false};
  std::string keyboardType{};
  std::string returnKeyType{};
  int maxLength{0};
  bool multiline{false};
  std::string placeholder{};
  SharedColor placeholderTextColor{};
  bool secureTextEntry{false};
  SharedColor selectionColor{};
  std::string value{};
  std::string defaultValue{};
  bool selectTextOnFocus{false};
  std::string submitBehavior{};
  bool caretHidden{false};
  bool contextMenuHidden{false};
  SharedColor textShadowColor{};
  Float textShadowRadius{0.0};
  std::string textDecorationLine{};
  std::string fontStyle{};
  AndroidTextInputTextShadowOffsetStruct textShadowOffset{};
  Float lineHeight{0.0};
  std::string textTransform{};
  SharedColor color{0};
  Float letterSpacing{0.0};
  Float fontSize{0.0};
  std::string textAlign{};
  bool includeFontPadding{false};
  std::string fontWeight{};
  std::string fontFamily{};
  std::string textAlignVertical{};
  SharedColor cursorColor{};
  int mostRecentEventCount{0};
  std::string text{};

  /*
   * Contains all prop values that affect visual representation of the
   * paragraph.
   */
  ParagraphAttributes paragraphAttributes{};

  /**
   * Auxiliary information to detect if these props are set or not.
   * See AndroidTextInputComponentDescriptor for usage.
   * TODO T63008435: can these, and this feature, be removed entirely?
   */
  bool hasPadding{};
  bool hasPaddingHorizontal{};
  bool hasPaddingVertical{};
  bool hasPaddingLeft{};
  bool hasPaddingTop{};
  bool hasPaddingRight{};
  bool hasPaddingBottom{};
  bool hasPaddingStart{};
  bool hasPaddingEnd{};

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace facebook::react
