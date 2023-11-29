/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/components/iostextinput/conversions.h>
#include <react/renderer/components/iostextinput/primitives.h>
#include <react/renderer/components/text/BaseTextProps.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/imagemanager/primitives.h>
#include <vector>

namespace facebook::react {

class TextInputProps final : public ViewProps, public BaseTextProps {
 public:
  TextInputProps() = default;
  TextInputProps(
      const PropsParserContext& context,
      const TextInputProps& sourceProps,
      const RawProps& rawProps);

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value);

#pragma mark - Props

  const TextInputTraits traits{};
  const ParagraphAttributes paragraphAttributes{};

  std::string const defaultValue{};

  std::string const placeholder{};
  const SharedColor placeholderTextColor{};

  int maxLength{};

  /*
   * Tint colors
   */
  const SharedColor cursorColor{};
  const SharedColor selectionColor{};
  const SharedColor selectionHandleColor{};
  // TODO: Rename to `tintColor` and make universal.
  const SharedColor underlineColorAndroid{};

  /*
   * "Private" (only used by TextInput.js) props
   */
  std::string const text{};
  const int mostRecentEventCount{0};

  bool autoFocus{false};
  std::optional<Selection> selection{};

  std::string const inputAccessoryViewID{};

  bool onKeyPressSync{false};
  bool onChangeSync{false};

  /*
   * Accessors
   */
  TextAttributes getEffectiveTextAttributes(Float fontSizeMultiplier) const;
  ParagraphAttributes getEffectiveParagraphAttributes() const;
};

} // namespace facebook::react
