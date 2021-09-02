/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/components/view/ViewEventEmitter.h>

namespace facebook {
namespace react {

class TextInputMetrics {
 public:
  std::string text;
  AttributedString::Range selectionRange;
  // ScrollView-like metrics
  Size contentSize;
  Point contentOffset;
  EdgeInsets contentInset;
  Size containerSize;
  int eventCount;
};

class KeyPressMetrics {
 public:
  std::string text;
  int eventCount;
};

class TextInputEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onFocus(TextInputMetrics const &textInputMetrics) const;
  void onBlur(TextInputMetrics const &textInputMetrics) const;
  void onChange(TextInputMetrics const &textInputMetrics) const;
  void onChangeText(TextInputMetrics const &textInputMetrics) const;
  void onContentSizeChange(TextInputMetrics const &textInputMetrics) const;
  void onSelectionChange(TextInputMetrics const &textInputMetrics) const;
  void onEndEditing(TextInputMetrics const &textInputMetrics) const;
  void onSubmitEditing(TextInputMetrics const &textInputMetrics) const;
  void onKeyPress(KeyPressMetrics const &textInputMetrics) const;

 private:
  void dispatchTextInputEvent(
      std::string const &name,
      TextInputMetrics const &textInputMetrics,
      EventPriority priority = EventPriority::AsynchronousBatched) const;
};

} // namespace react
} // namespace facebook
