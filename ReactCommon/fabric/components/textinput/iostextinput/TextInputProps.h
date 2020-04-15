/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/attributedstring/ParagraphAttributes.h>
#include <react/attributedstring/TextAttributes.h>
#include <react/components/iostextinput/conversions.h>
#include <react/components/iostextinput/primitives.h>
#include <react/components/text/BaseTextProps.h>
#include <react/components/view/ViewProps.h>
#include <react/core/Props.h>
#include <react/core/propsConversions.h>
#include <react/graphics/Color.h>
#include <react/imagemanager/primitives.h>
#include <vector>

namespace facebook {
namespace react {

class TextInputProps final : public ViewProps, public BaseTextProps {
 public:
  TextInputProps() = default;
  TextInputProps(TextInputProps const &sourceProps, RawProps const &rawProps);

#pragma mark - Props

  TextInputTraits const traits{};
  ParagraphAttributes const paragraphAttributes{};

  std::string const defaultValue{};

  std::string const placeholder{};
  SharedColor const placeholderTextColor{};

  int maxLength{};

  /*
   * Tint colors
   */
  SharedColor const cursorColor{};
  SharedColor const selectionColor{};
  // TODO: Rename to `tintColor` and make universal.
  SharedColor const underlineColorAndroid{};

  /*
   * "Private" (only used by TextInput.js) props
   */
  std::string const text{};
  int const mostRecentEventCount{0};

  /*
   * Accessors
   */
  TextAttributes getEffectiveTextAttributes() const;
  ParagraphAttributes getEffectiveParagraphAttributes() const;

#ifdef ANDROID
  folly::dynamic getDynamic() const;
#endif
};

} // namespace react
} // namespace facebook
